import {AchievementEnum, IAchievement, PromoCodeType, Rank, User} from '../../db';
import {ICheckAchievementResult} from "../achievement-service";
import {generatePromoCode} from "../promocode-service";

/**
 * Возвращаем ранги пользователя.
 * @param points
 * @param ranks
 */
export const getUserRanks = (points: number, ranks: Rank[]) => {
  const ranksSorted = ranks.sort((a, b) => {
    return a.minPoints - b.minPoints;
  });

  // Находим текущий и следующий ранг пользователя
  return ranksSorted.reduce<{rank: Rank | null; nextRank: Rank | null}>(
    (acc, r) => {
      if (points >= r.minPoints) {
        acc.rank = r;
      } else {
        if (acc.nextRank === null) {
          acc.nextRank = r;
        }
      }
      return acc;
    }, {rank: null, nextRank: null},
  );
};

/**
 * Добавляем очки за достижение, генерим промокод
 * @param user
 * @param achievement
 * @param receivedPromoCodes
 * @param checkAchievementResult
 * @param ranks
 */
export const addPointsForAchievement = (
  user: User,
  achievement: IAchievement,
  receivedPromoCodes: Array<'warrior' | 'visitor'>,
  checkAchievementResult: ICheckAchievementResult,
  ranks: Rank[],
) => {
  const {addToReceivedRequired, levelUpgrade, pointsToAdd} = checkAchievementResult;
  if (addToReceivedRequired) {
    user.achievementsReceived.push(achievement);
  }
  if (levelUpgrade) {
    if (achievement.id === AchievementEnum.Visitor) {
      receivedPromoCodes.push('visitor');
    }
    if (achievement.id === AchievementEnum.Warrior) {
      receivedPromoCodes.push('warrior');
    }
    user.promoCodes.push(generatePromoCode(PromoCodeType.Discount20VipFrom2Hours));
  }
  if (pointsToAdd > 0) {
    user.points += pointsToAdd;
    const {rank, nextRank} = getUserRanks(user.points, ranks);
    if (rank) {
      user.rank = rank;
    }
    if (nextRank) {
      user.nextRank = nextRank;
    }
  }
};