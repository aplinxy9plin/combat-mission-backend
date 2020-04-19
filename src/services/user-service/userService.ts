import {AchievementEnum, Collection, IAchievement, Profile, PromoCode, PromoCodeType, User} from '../../db';
import Database from '../../db/Database';
import dayjs from "dayjs";
import {formatUserWithPromo, generatePromoCode} from '../promocode-service';
import {addPointsForAchievement, getUserRanks,} from "./utils";
import * as utils from '../utils';
import {decrypt} from "../../http/crypto";
import {checkAchievement} from "../achievement-service";

/**
 * Возвращаем информацию о текущем пользователе, включая полученные промокоды
 * @param db
 * @param userId
 */
export const getCurrentUserInfo = async (db: Database, userId: number) => {
  const usersCollection = db.collection(Collection.Users);
  const foundUser = await usersCollection.findOne({id: userId});

  if (!foundUser) {
    return {
      error: {
        code: 404,
        message: 'Пользователь не найден.',
      }
    }
  }

  // Мы выдаем промо в зависимости того, был получен новый уровень или нет.
  const receivedPromoCodes: Array<'warrior' | 'visitor'> = [];

  const lastFixedVisit = dayjs(foundUser.lastFixedVisitDate);
  const now = dayjs();
  const lastDate = lastFixedVisit.get('date');
  const nowDate = now.get('date');
  const diff = Math.abs(nowDate - lastDate);

  if (diff >= 1) {
    const {Visitor, Warrior} = AchievementEnum;
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
      const checkAchievementResult = checkAchievement(visitorAchievement, visitsCount, nextVisitsCount);
      addPointsForAchievement(foundUser, visitorAchievement, receivedPromoCodes, checkAchievementResult, ranks);
    }

    // Если есть разница в 1 день, значит пользователь заходит какой-то день
    // подряд. С этим есть связанные ачивки.
    if (diff === 1) {
      foundUser.visitsInRow++;
      const prevAchievementVisits = achievementsProgress[Warrior] || 0;

      if (prevAchievementVisits < foundUser.visitsInRow) {
        achievementsProgress[Warrior] = foundUser.visitsInRow;
      }

      if (warriorAchievement && warriorAchievement.points) {
        const checkAchievementResult = checkAchievement(warriorAchievement, prevAchievementVisits, foundUser.visitsInRow);
        addPointsForAchievement(foundUser, warriorAchievement, receivedPromoCodes, checkAchievementResult, ranks);
      }
    }
    // Если разница больше чем в 1 день, значит дропаем стрик.
    else {
      foundUser.visitsInRow = 0;
    }

    await usersCollection.updateOne({id: userId}, {$set: foundUser});
  }

  return {
    user: formatUserWithPromo(foundUser),
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
  try {
    // Расшифровываем чек.
    const decrypted = decrypt(check);

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
      const achievement = achievements.find(a => a.id === AchievementEnum.BorderGuard);
      if (achievement) {
        const points = foundUser.achievementsProgress[AchievementEnum.BorderGuard] || 0;
        const nextPoints = points + 1;
        const {addToReceivedRequired, levelUpgrade, pointsToAdd} = checkAchievement(achievement, points, nextPoints);

        foundUser.points += pointsToAdd;
        foundUser.achievementsProgress[AchievementEnum.BorderGuard] = nextPoints;
        foundUser.activatedChecks.push(payload);

        if (levelUpgrade) {
          foundUser.promoCodes.push(generatePromoCode(PromoCodeType.Discount20VipFrom2Hours));
          promoReceived = true;
        }
        if (addToReceivedRequired) {
          foundUser.achievementsReceived.push(achievement);
        }
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
 * Сохраняем профиль пользователя
 * @param profile
 * @param db
 * @param userId
 */
export const saveProfile = async (profile: any, db: Database, userId: number) => {
  const [games, stages] = await Promise.all([
    db.collection(Collection.Games).find({}).toArray(),
    db.collection(Collection.Stages).find({}).toArray(),
  ]);
  const foundGames = games.filter(g => profile.gamesIds.includes(g.id));
  const foundStage = stages.find(s => s.id === profile.stageId);
  let foundUser = await db.collection(Collection.Users).findOne({id: userId});

  if (foundGames.length === 0 || !foundStage || !foundUser) {
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
  await db.collection(Collection.Users).updateOne({id: userId}, {$set: {profile: userProfile}});

  // Возвращаем информацию о пользователе с профилем.
  foundUser = await db.collection(Collection.Users).findOne(
    {id: userId},
    {projection: {profile: true}},
  );
  return !foundUser ? null : foundUser.profile;
};

/**
 * Удаляем профиль пользователя
 * @param db
 * @param userId
 */
export const deleteProfile = async (db: Database, userId: number) => {
  await db.collection(Collection.Users).updateOne({id: userId}, {$unset: {profile: ''}});
  return true;
};

/**
 * Возвращаем команду, в которой состоит пользователь
 * @param db
 * @param userId
 */
export const getUserTeam = async (db: Database, userId: number) => {
  const team = await db.collection(Collection.Teams).findOne({
    'users.id': userId,
  });
  return team || null;
};

/**
 * Возвращаем пользователя
 * @param db
 * @param userId
 */
export const getUser = async (db: Database, userId: number) => {
  return await db.collection(Collection.Users).findOne({id: userId}, {
    projection: {
      achievementsReceived: true,
      avatarUrl: true,
      id: true,
      profile: true,
      rank: true,
    },
  });
};

/**
 * Регистрируем пользователя
 * @param db
 * @param userId
 * @param avatarUrl
 */
export const registerUser = async (db: Database, userId: number, avatarUrl: string) => {
  const usersCollection = db.collection(Collection.Users);
  let foundUser = await usersCollection.findOne({id: userId});

  let promoCode: PromoCode | null = null;

  if (!foundUser) {
    const ranks = await db.collection(Collection.Ranks).find({}).toArray();
    const {rank, nextRank} = getUserRanks(0, ranks);

    // Даем промокод за первое посещение приложения.
    promoCode = generatePromoCode(PromoCodeType.Discount20VipFrom2Hours);
    foundUser = {
      achievementsReceived: [],
      achievementsProgress: {
        [AchievementEnum.Visitor]: 1,
        [AchievementEnum.Warrior]: 0,
        [AchievementEnum.BorderGuard]: null,
        [AchievementEnum.Correspondent]: null,
        [AchievementEnum.LivingFullLife]: null,
        [AchievementEnum.TeamPlayer]: null,
        [AchievementEnum.RichSoul]: null,
      },
      activatedChecks: [],
      avatarUrl,
      id: userId,
      points: 100,
      promoCodes: [promoCode],
      lastFixedVisitDate: new Date().getTime(),
      visitsInRow: 0,
      rank: null,
      nextRank: null,
      profile: null,
    };
    if (rank) {
      foundUser.rank = rank;
    }
    if (nextRank) {
      foundUser.nextRank = nextRank;
    }
    await usersCollection.insertOne(foundUser);
  }

  return {
    user: formatUserWithPromo(foundUser),
    newbiePromoReceived: true,
  };
};

/**
 * Возвращаем справочники и прочие данные для анкеты
 * @param db
 */
export const getProfileMeta = async (db: Database) => {
  const gamesCollection = db.collection(Collection.Games);
  const stagesCollection = db.collection(Collection.Stages);

  const [games, stages] = await Promise.all([
    gamesCollection.find().toArray(),
    stagesCollection.find().toArray(),
  ]);
  return {games, stages};
};