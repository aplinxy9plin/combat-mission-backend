import Database, {Collection, IAchievement} from '../../db';

interface ICheckAchievementResult {
  addToReceivedRequired: boolean;
  levelUpgrade: boolean;
  pointsToAdd: number;
}

/**
 * Возвращает уровень относительно указанных очков.
 * @param points
 * @param currentPoints
 */
export const getLevel = (points: number[], currentPoints: number): number => {
  return points
    .sort((a, b) => a - b)
    .reduce<number>((acc, p, idx) => p <= currentPoints ? idx + 1 : acc, 0);
};

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

export const getAchievements = async (db: Database) => {
  return await db.collection(Collection.Achievements).find().toArray()
};