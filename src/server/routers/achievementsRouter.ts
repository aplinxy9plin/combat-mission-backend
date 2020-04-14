import {Request, Router} from 'express';
import {VerifiedResponse} from '../types';
import {Achievement, Collection, PromoCodeType} from '../../db';
import {formatUserWithPromo, generatePromoCode} from '../../promo';
import {getUserRanks} from './utils';

const achievementsRouter = Router();

/**
 * Возвращает middleware который выполняет получение пользователем достижения
 * @returns {(req: e.Request, res: VerifiedResponse) => Promise<void>}
 * @param achievementId
 */
function processAchievement(achievementId: Achievement) {
  return async (req: Request, res: VerifiedResponse) => {
    const {db, user} = res.locals;
    const usersCollection = db.collection(Collection.Users);
    let promoReceived = false;
    const [achievements, ranks, foundUser] = await Promise.all([
      db.collection(Collection.Achievements).find({}).toArray(),
      db.collection(Collection.Ranks).find({}).toArray(),
      usersCollection.findOne({id: user.id}),
    ]);

    if (foundUser && achievements && ranks) {
      const achievement = achievements.find(a => a.id === achievementId);

      if (achievement) {
        const alreadyReceived = foundUser.achievementsReceived.some(a => {
          return a.id === achievement.id;
        });

        if (
          !alreadyReceived
          && achievement.rankPoints
          && achievement.rankPoints.length > 0
        ) {
          promoReceived = true;
          const promoCode = generatePromoCode(
            PromoCodeType.Discount20VipFrom2Hours,
          );
          foundUser.points += achievement.rankPoints[0];
          foundUser.achievementsProgress[achievement.id] = 1;
          foundUser.achievementsReceived.push(achievement);
          foundUser.promoCodes.push(promoCode);

          const {rank, nextRank} = getUserRanks(foundUser.points, ranks);
          if (rank) {
            foundUser.rank = rank;
          }
          if (nextRank) {
            foundUser.nextRank = nextRank;
          }

          await usersCollection.updateOne(
            {id: user.id},
            {
              $set: {
                rank: foundUser.rank,
                nextRank: foundUser.nextRank,
                points: foundUser.points,
                [`achievementsProgress.${achievement.id}`]: 1,
              },
              $push: {
                achievementsReceived: achievement,
                promoCodes: promoCode,
              },
            },
          )
        }
      }
    }

    res.json({
      user: foundUser ? formatUserWithPromo(foundUser) : null,
      promoReceived,
    });
  };
}

/**
 * Поделились записью.
 */
achievementsRouter.post(
  '/share',
  processAchievement(Achievement.RichSoul),
);

/**
 * Подписка на группу.
 */
achievementsRouter.post(
  '/subscribe',
  processAchievement(Achievement.Correspondent),
);

export default achievementsRouter;
