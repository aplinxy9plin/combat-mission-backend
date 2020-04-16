import {Achievement, Collection, IAchievement, Profile, PromoCodeType, User} from '../../db';
import Database from '../../db/Database';
import dayjs from "dayjs";
import {formatUserWithPromo} from '../promocode-service';
import {
  checkIfUserReceivedUpgradeByTotalVisits,
  checkIfUserLogsInSomeDayInRow,
  checkIfUserIsBorderGuard,
} from "./utils";
import * as utils from '../utils';
import {decrypt} from "../../http/crypto";
import {checkAchievement} from "../achievement-service";
import {InputProfile} from "../../temp-bridge";

export const getCurrentUserInfo = async (db: Database, userId: number) => {
  const usersCollection = db.collection(Collection.Users);
  const foundUser = await usersCollection.findOne({id: userId});

  if (!foundUser) {
    return {error: 'пользователь не найден'};
  }

  // Мы выдаем промо в зависимости того, был получен новый уровень или нет.
  const receivedPromoCodes: Array<'warrior' | 'visitor'> = [];

  const lastFixedVisit = dayjs(foundUser.lastFixedVisitDate);
  const now = dayjs();
  const lastDate = lastFixedVisit.get('date');
  const nowDate = now.get('date');
  const diff = Math.abs(nowDate - lastDate);

  if (diff >= 1) {
    const {Visitor, Warrior} = Achievement;
    const achievements = await db.collection(Collection.Achievements)
      .find({}).toArray();
    const ranks = await db.collection(Collection.Ranks).find({}).toArray();
    const warriorAchievement = achievements.find(a => a.id === Warrior);
    const visitorAchievement = achievements.find(a => a.id === Visitor);
    const {achievementsProgress} = foundUser;
    const visitsCount = achievementsProgress[Visitor] || 1;
    const nextVisitsCount = visitsCount + 1;

    foundUser.lastFixedVisitDate = now.unix() * 1000;
    achievementsProgress[Visitor] = nextVisitsCount;

    // Проверяем, получил ли апгрейд по общему числу посещений.
    if (visitorAchievement && ranks) {
      checkIfUserReceivedUpgradeByTotalVisits(foundUser, receivedPromoCodes, visitorAchievement, ranks);
    }

    // Если есть разница в 1 день, значит пользователь заходит какой-то день
    // подряд. С этим есть связанные ачивки.
    if (diff === 1) {
      checkIfUserLogsInSomeDayInRow(foundUser, receivedPromoCodes, warriorAchievement, ranks);
    }
    // Если разница больше чем в 1 день, значит дропаем стрик.
    else {
      foundUser.visitsInRow = 0;
    }

    await usersCollection.updateOne({id: userId}, {$set: foundUser});
  }
  const formattedUser = formatUserWithPromo(foundUser);
  return {
    user: formattedUser,
    receivedPromoCodes,
  };
};

/**
 * Активируем чек
 * @param check
 * @param db
 * @param userId
 */
export const activateCheck = async (check: string, db: Database, userId: number) => {
  // Расшифровываем чек.
  const decrypted = decrypt(check);

  try {
    const content = JSON.parse(decrypted);

    if (utils.isObject(content)! || utils.isString(content.payload)!) {
      return {
        error: {
          code: 400,
          message: 'К сожалению, это не QR-код Colizeum.',
          activated: false,
        }
      };
    }
    const usersCollection = db.collection(Collection.Users);
    const achievementsCollection = db.collection(Collection.Achievements);
    const {payload} = content;

    // Пытаемся найти уже активированный чек.
    const isActivated = await usersCollection.findOne({
      activatedChecks: {$in: [payload]},
    });

    if (!!isActivated) {
      return {
        error: {
          code: 400,
          message: 'Чек уже был активирован.',
          activated: false,
        }
      };
    }

    // Накидываем очки за пограничника и записываем чек.
    const [foundUser, achievements] = await Promise.all([
      usersCollection.findOne({id: userId}),
      achievementsCollection.find({}).toArray(),
    ]) as [User | null, IAchievement[]];
    let promoReceived = false;

    if (foundUser && achievements) {
      const {BorderGuard} = Achievement;
      const borderGuardAchievement = achievements.find(a => a.id === BorderGuard);

      if (borderGuardAchievement) {
        checkIfUserIsBorderGuard(foundUser, borderGuardAchievement, payload, promoReceived);
        // Ставим метку о том что чек уже активирован.
        await usersCollection.updateOne({id: userId}, {$set: foundUser});
      }
    }

    return {
      message: 'Чек успешно активирован.',
      activated: true,
      user: foundUser ? formatUserWithPromo(foundUser) : null,
      promoReceived,
    };
  } catch (e) {
    return {
      error: {
        code: 400,
        message: 'К сожалению, это не QR-код Colizeum.',
        activated: false,
      },
    };
  }
};

/**
 * Сохраняет профиль пользователя
 * @param profile
 * @param db
 * @param userId
 */
export const saveProfile = async (profile: InputProfile, db: Database, userId: number) => {
  const [games, stages] = await Promise.all([
    db.collection(Collection.Games).find({}).toArray(),
    db.collection(Collection.Stages).find({}).toArray(),
  ]);
  const foundGames = games.filter(g => profile.gamesIds.includes(g.id));
  const foundStage = stages.find(s => s.id === profile.stageId);

  if (foundGames.length === 0 || !foundStage) {
    return {
      error: {
        code: 400,
        message: 'Некорректные данные',
      }
    };
  }

  const userProfile: Profile = {
    age: profile.age,
    about: profile.about,
    city: profile.city,
    clubId: profile.clubId,
    games: foundGames,
    playTime: profile.playTime % 48,
    stage: foundStage,
  };
  // Обновляем профиль.
  await db.collection(Collection.Users).updateOne({id: userId}, {$set: {userProfile}});

  // Возвращаем информацию о пользователе с профилем.
  const foundUser = await db.collection(Collection.Users).findOne(
    {id: userId},
    {projection: {profile: true}},
  );

  return foundUser ? foundUser.profile : {};
};

/**
 * Удаляет профиль пользователя
 * @param db
 * @param userId
 */
export const deleteProfile = async (db: Database, userId: number) => {
  await db.collection(Collection.Users).updateOne({id: userId}, {$unset: {profile: ''}});
  return true;
};

/**
 * Находим команду, в которой состоит пользователь
 * @param db
 * @param userId
 */
export const getUserTeam = async (db: Database, userId: number) => {
  const team = await db.collection(Collection.Teams).findOne({
    'users.id': userId,
  });
  return team || null;
};