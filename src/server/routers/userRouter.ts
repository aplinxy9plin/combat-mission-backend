import {Router} from 'express';
import {VerifiedResponse} from '../types';
import {
  Achievement,
  Collection,
  IAchievement,
  Profile,
  PromoCodeType,
  User,
} from '../../db';
import {getUserRanks, isEmptyString, isNumber, isString} from './utils';
import {decrypt} from '../crypto';
import dayjs from 'dayjs';
import {checkAchievement} from '../../achievements';
import {
  formatPromoCode,
  formatUserWithPromo,
  generatePromoCode,
} from '../../promo';
import achievementsRouter from './achievementsRouter';

const userRouter = Router();

/**
 * Обработчик всех запросов касательно ачивок
 */
userRouter.use('/achievements', achievementsRouter);

/**
 * Возвращает информацию о текущем пользователе.
 */
userRouter.get('/info', async (req, res: VerifiedResponse) => {
  const {db, user} = res.locals;
  const usersCollection = db.collection(Collection.Users);
  let foundUser = await usersCollection.findOne({id: user.id});

  if (!foundUser) {
    return res.status(404).json({error: 'Пользователь не найден'});
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
    const {Discount20VipFrom2Hours} = PromoCodeType;
    const achievements = await db.collection(Collection.Achievements)
      .find({}).toArray();
    const ranks = await db.collection(Collection.Ranks).find({}).toArray();
    const visitorAchievement = achievements.find(a => a.id === Visitor);
    const warriorAchievement = achievements.find(a => a.id === Warrior);
    const {achievementsProgress, achievementsReceived} = foundUser;
    const visitsCount = achievementsProgress[Visitor] || 1;
    const nextVisitsCount = visitsCount + 1;

    foundUser.lastFixedVisitDate = now.unix() * 1000;
    achievementsProgress[Visitor] = nextVisitsCount;

    // Проверяем, получил ли апгрейд по общему числу посещений.
    if (visitorAchievement && ranks) {
      const {
        addToReceivedRequired, levelUpgrade, pointsToAdd,
      } = checkAchievement(
        visitorAchievement, visitsCount, nextVisitsCount,
      );
      if (addToReceivedRequired) {
        achievementsReceived.push(visitorAchievement);
      }
      if (levelUpgrade) {
        receivedPromoCodes.push('visitor');
        foundUser.promoCodes.push(generatePromoCode(Discount20VipFrom2Hours));
      }
      if (pointsToAdd > 0) {
        foundUser.points += pointsToAdd;
        const {rank, nextRank} = getUserRanks(foundUser.points, ranks);
        if (rank) {
          foundUser.rank = rank;
        }
        if (nextRank) {
          foundUser.nextRank = nextRank;
        }
      }
    }

    // Если есть разница в 1 день, значит пользователь заходит какой-то день
    // подряд. С этим есть связанные ачивки.
    if (diff === 1) {
      foundUser.visitsInRow++;
      let prevAchievementVisits = achievementsProgress[Warrior] || 0;

      if (prevAchievementVisits < foundUser.visitsInRow) {
        achievementsProgress[Warrior] = foundUser.visitsInRow;
      }

      if (warriorAchievement && warriorAchievement.points) {
        const {
          addToReceivedRequired, levelUpgrade, pointsToAdd,
        } = checkAchievement(
          warriorAchievement,
          prevAchievementVisits,
          foundUser.visitsInRow,
        );
        if (addToReceivedRequired) {
          achievementsReceived.push(warriorAchievement);
        }
        if (levelUpgrade) {
          receivedPromoCodes.push('warrior');
          foundUser.promoCodes.push(generatePromoCode(Discount20VipFrom2Hours));
        }
        if (pointsToAdd > 0) {
          foundUser.points += pointsToAdd;
          const {rank, nextRank} = getUserRanks(foundUser.points, ranks);
          if (rank) {
            foundUser.rank = rank;
          }
          if (nextRank) {
            foundUser.nextRank = nextRank;
          }
        }
      }
    }
    // Если разница больше чем в 1 день, значит дропаем стрик.
    else {
      foundUser.visitsInRow = 0;
    }

    await usersCollection.updateOne({id: user.id}, {$set: foundUser});
  }
  const formattedUser = formatUserWithPromo(foundUser);

  res.json({user: formattedUser, receivedPromoCodes});
});

/**
 * Проводит активацию чека.
 */
userRouter.post('/check', async (req, res: VerifiedResponse) => {
  const {check} = req.body;

  // Проверяем валидность данных.
  if (typeof check !== 'string') {
    return res.status(400).json({error: 'Чек не указан.'});
  }
  // Расшифровываем чек.
  const decrypted = decrypt(check);

  try {
    const content = JSON.parse(decrypted);

    if (typeof content !== 'object' || typeof content.payload !== 'string') {
      return res.status(400).json({
        error: {
          message: 'К сожалению, это не QR-код Colizeum.',
          activated: false,
        },
      });
    }
    const {db, user} = res.locals;
    const usersCollection = db.collection(Collection.Users);
    const achievementsCollection = db.collection(Collection.Achievements);
    const {payload} = content;

    // Пытаемся найти уже активированный чек.
    const isActivated = await usersCollection.findOne({
      activatedChecks: {$in: [payload]},
    });

    if (!!isActivated) {
      return res.status(400).json({
        error: {
          message: 'Чек уже был активирован.',
          activated: false,
        },
      });
    }

    // Накидываем очки за пограничника и записываем чек.
    const [foundUser, achievements] = await Promise.all([
      usersCollection.findOne({id: user.id}),
      achievementsCollection.find({}).toArray(),
    ]) as [User | null, IAchievement[]];
    let promoReceived = false;

    if (foundUser && achievements) {
      const {BorderGuard} = Achievement;
      const {Discount20VipFrom2Hours} = PromoCodeType;
      const achievement = achievements.find(a => a.id === BorderGuard);

      if (achievement) {
        const points = foundUser.achievementsProgress[BorderGuard] || 0;
        const nextPoints = points + 1;
        const {
          addToReceivedRequired, pointsToAdd, levelUpgrade,
        } = checkAchievement(achievement, points, nextPoints);
        foundUser.points += pointsToAdd;
        foundUser.achievementsProgress[BorderGuard] = nextPoints;
        foundUser.activatedChecks.push(payload);

        if (levelUpgrade) {
          const promoCode = generatePromoCode(Discount20VipFrom2Hours);
          promoReceived = true;
          foundUser.promoCodes.push(promoCode);
        }
        if (addToReceivedRequired) {
          foundUser.achievementsReceived.push(achievement);
        }
        // Ставим метку о том что чек уже активирован.
        await usersCollection.updateOne({id: user.id}, {$set: foundUser});
      }
    }

    res.json({
      message: 'Чек успешно активирован.',
      activated: true,
      user: foundUser ? formatUserWithPromo(foundUser) : null,
      promoReceived,
    });
  } catch (e) {
    return res.status(400).json({
      error: {
        message: 'К сожалению, это не QR-код Colizeum.',
        activated: false,
      },
    });
  }
});

/**
 * Сохраняет профиль пользователя.
 */
userRouter.post('/profile', async (req, res: VerifiedResponse) => {
  const {age, about, city, clubId, gamesIds, playTime, stageId} = req.body;

  if (
    !isNumber(age)
    || age < 14
    || age > 100
    || !isString(city)
    || isEmptyString(city)
    || !isNumber(clubId)
    || !Array.isArray(gamesIds)
    || gamesIds.some(g => !isNumber(g))
    || !isNumber(playTime)
    || !isNumber(stageId)
    || (typeof about !== 'undefined' && typeof about !== 'string')
  ) {
    return res.status(400).json({error: 'Некорректные данные'});
  }

  const {user, db} = res.locals;
  const [games, stages] = await Promise.all([
    db.collection(Collection.Games).find({}).toArray(),
    db.collection(Collection.Stages).find({}).toArray(),
  ]);
  const foundGames = games.filter(g => gamesIds.includes(g.id));
  const foundStage = stages.find(s => s.id === stageId);

  if (foundGames.length === 0 || !foundStage) {
    return res.status(400).json({error: 'Некорректные данные'});
  }

  const profile: Profile = {
    age, about, city, clubId, games: foundGames, playTime: playTime % 48,
    stage: foundStage,
  };
  // Обновляем профиль.
  await db.collection(Collection.Users).updateOne({id: user.id}, {$set: {profile}});

  // Возвращаем информацию о пользователе с профилем.
  const foundUser = await db.collection(Collection.Users).findOne(
    {id: user.id},
    {projection: {profile: true}},
  );

  res.json(foundUser ? foundUser.profile : {});
});

/**
 * Удаляет профиль пользователя.
 */
userRouter.delete('/profile', async (req, res: VerifiedResponse) => {
  const {db, user} = res.locals;
  await db.collection(Collection.Users).updateOne({id: user.id}, {$unset: {profile: ''}});

  res.json(true);
});

userRouter.get('/team', async (req, res: VerifiedResponse) => {
  const {db, user} = res.locals;

  const team = await db.collection(Collection.Teams).findOne({
    'users.id': user.id,
  });
  res.json(team || null);
});

userRouter.post('/open-promo', async (req, res: VerifiedResponse) => {
  const {id} = req.body;

  if (typeof id !== 'string') {
    return res.sendStatus(400);
  }
  const {user, db} = res.locals;
  const foundUser = await db.collection(Collection.Users).findOne({id: user.id});

  if (!foundUser) {
    return res.status(404).json({error: 'Пользователь не найден'});
  }
  const promo = foundUser.promoCodes.find(p => p.id === id);

  if (!promo) {
    return res.status(404).json({error: 'Промокод не найден'});
  }
  if (!promo.openedAt) {
    const index = foundUser.promoCodes.indexOf(promo);
    const now = dayjs();
    promo.openedAt = now.toDate();
    promo.expiresAt = now.add(1, 'day').toDate();

    await db.collection(Collection.Users).updateOne(
      {id: user.id},
      {
        $set: {
          [`promoCodes.${index}.openedAt`]: promo.openedAt,
          [`promoCodes.${index}.expiresAt`]: promo.expiresAt,
        },
      },
    );
  }
  res.json(formatPromoCode(promo));
});

export default userRouter;
