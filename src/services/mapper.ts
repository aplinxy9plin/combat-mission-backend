import {
  User as GqlUser,
  AchievementEnum as GqlAchievement,
  AchievementProgress,
  PromoCode as GqlPromoCode,
  PromoCodeType as GqlPromoCodeType,
} from 'combat-mission-bridge';
import {AchievementEnum, User} from "../db";
import {omit} from "./utils";

/**
 * Маппим тип User в тип User, который используется в graphql.
 * @param user
 */
export const mapUserFromMongoToGQLFormat = (user: User) => {
  const promoCodes = user.promoCodes;
  const promoCodesInGql: GqlPromoCode[] = [];
  promoCodes.map((promo, index) => {
    const promoType: string = promo.type;
    promoCodesInGql.push({
      id: promo.id,
      type: promoType as GqlPromoCodeType,
      title: promo.title,
      value: promo.value,
      openedAt: promo.openedAt ? promo.openedAt.toISOString() : null,
      expiresAt: promo.expiresAt.toISOString(),
    });
  });

  const achievementsProgress = user.achievementsProgress;
  const achievementsProgressInGql: { achievementId: GqlAchievement; progress: number | null }[] = [];
  Object.keys(achievementsProgress).map((achievement, index) => {
    achievementsProgressInGql.push({
      achievementId: index as AchievementEnum,
      progress: achievementsProgress[index as AchievementEnum]
    });
  });

  const userData: GqlUser = {
    achievementsReceived: user.achievementsReceived,
    achievementsProgress: achievementsProgressInGql,
    activatedChecks: user.activatedChecks,
    avatarUrl: user.avatarUrl,
    id: user.id,
    promoCodes: promoCodesInGql,
    profile: user.profile,
    points: user.points,
    rank: user.rank,
    lastFixedVisitDate: user.lastFixedVisitDate,
    nextRank: user.nextRank,
    visitsInRow: user.visitsInRow,
  };
  return userData;
};