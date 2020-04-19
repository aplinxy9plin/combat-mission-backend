import Database, {AchievementEnum, Collection, IAchievement, PromoCodeType} from '../../db';
import {generatePromoCode} from "../promocode-service";
import {getUserRanks} from "../user-service/utils";

export interface ICheckAchievementResult {
  addToReceivedRequired: boolean;
  levelUpgrade: boolean;
  pointsToAdd: number;
}

/**
 * Возвращаем уровень относительно указанных очков.
 * @param points
 * @param currentPoints
 */
export const getLevel = (points: number[], currentPoints: number): number => {
  return points
    .sort((a, b) => a - b)
    .reduce<number>((acc, p, idx) => p <= currentPoints ? idx + 1 : acc, 0);
};

/**
 * Проверяем, нужно ли апнуть уровень и если да, то сколько очков нужно добавить
 * @param achievement
 * @param currentPoints
 * @param nextPoints
 */
export const checkAchievement = (
  achievement: IAchievement,
  currentPoints: number,
  nextPoints: number,
): ICheckAchievementResult => {
  const {points, rankPoints} = achievement;
  let addToReceivedRequired = false;
  let levelUpgrade = false;
  let pointsToAdd = 0;

  if (points) {
    const currentLevel = getLevel(points, currentPoints);
    const nextLevel = getLevel(points, nextPoints);

    if (currentLevel < nextLevel) {
      levelUpgrade = true;

      if (rankPoints) {
        pointsToAdd = rankPoints[nextLevel - 1] || 0;
      }

      if (currentLevel === 0) {
        addToReceivedRequired = true;
      }
    }
  }

  return {addToReceivedRequired, levelUpgrade, pointsToAdd};
};

/**
 * Выполняем получение достижения пользователем
 * @param db
 * @param achievementId
 * @param userId
 */
export const processAchievement = async (db: Database, achievementId: AchievementEnum, userId: number) => {
  const usersCollection = db.collection(Collection.Users);
  let promoReceived = false;
  const [achievements, ranks, foundUser] = await Promise.all([
    db.collection(Collection.Achievements).find({}).toArray(),
    db.collection(Collection.Ranks).find({}).toArray(),
    usersCollection.findOne({id: userId}),
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
          {id: userId},
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
  return {
    user: !foundUser ? null : foundUser,
    promoReceived,
  }
};

/**
 * Возвращаем все достижения
 * @param db
 */
export const getAchievements = (db: Database) => {
  return db.collection(Collection.Achievements).find().toArray()
};

/**
 * Репост
 * @param db
 * @param userId
 */
export const processPostSharing = (db: Database, userId: number) => {
  return processAchievement(db, AchievementEnum.RichSoul, userId);
};

/**
 * Подписка на группу
 * @param db
 * @param userId
 */
export const processGroupSubscription = (db: Database, userId: number) => {
  return processAchievement(db, AchievementEnum.Correspondent, userId);
};