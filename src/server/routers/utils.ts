import {Rank} from '../../db';

/**
 * Проверяет, является ли значение числом.
 * @param value
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number';
}

/**
 * Проверяет, является ли значение строкой.
 * @param value
 */
export function isString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * Проверяет, является ли значение пустой строкой
 * @param value
 */
export function isEmptyString(value: string): boolean {
  return value.length === 0;
}

/**
 * Возвращает ранги пользователя.
 * @param points
 * @param ranks
 */
export function getUserRanks(points: number, ranks: Rank[]) {
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
}
