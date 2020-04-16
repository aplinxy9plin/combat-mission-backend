import {Achievement, Collection, IAchievement, PromoCodeType, User} from '../../db';
import {Rank} from "../../db";
import {checkAchievement} from "../achievement-service";
import {generatePromoCode} from "../promocode-service";

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

export const checkIfUserReceivedUpgradeByTotalVisits = (
  foundUser: User,
  receivedPromoCodes: Array<'warrior' | 'visitor'>,
  visitorAchievement: IAchievement,
  ranks: Rank[]
) => {
  const {achievementsProgress, achievementsReceived} = foundUser;
  const {Visitor} = Achievement;
  const {Discount20VipFrom2Hours} = PromoCodeType;
  const visitsCount = achievementsProgress[Visitor] || 1;
  const nextVisitsCount = visitsCount + 1;
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
};

export const checkIfUserLogsInSomeDayInRow = (
  foundUser: User,
  receivedPromoCodes: Array<"warrior" | "visitor">,
  warriorAchievement: IAchievement | undefined,
  ranks: Rank[]
) => {
  const {achievementsProgress, achievementsReceived} = foundUser;
  const {Warrior} = Achievement;
  const {Discount20VipFrom2Hours} = PromoCodeType;
  foundUser.visitsInRow++;
  const prevAchievementVisits = achievementsProgress[Warrior] || 0;

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
};

export const checkIfUserIsBorderGuard = (
  foundUser: User,
  borderGuardAchievement: IAchievement,
  payload: string,
  promoReceived: boolean
) => {
  const {BorderGuard} = Achievement;
  const {Discount20VipFrom2Hours} = PromoCodeType;

  const points = foundUser.achievementsProgress[BorderGuard] || 0;
  const nextPoints = points + 1;
  const {
    addToReceivedRequired, pointsToAdd, levelUpgrade,
  } = checkAchievement(borderGuardAchievement, points, nextPoints);
  foundUser.points += pointsToAdd;
  foundUser.achievementsProgress[BorderGuard] = nextPoints;
  foundUser.activatedChecks.push(payload);

  if (levelUpgrade) {
    const promoCode = generatePromoCode(Discount20VipFrom2Hours);
    promoReceived = true;
    foundUser.promoCodes.push(promoCode);
  }
  if (addToReceivedRequired) {
    foundUser.achievementsReceived.push(borderGuardAchievement);
  }
};