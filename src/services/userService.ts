import {Rank} from '../db';

/**
 * Возвращает ранги пользователя.
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