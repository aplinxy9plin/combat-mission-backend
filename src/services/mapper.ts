import {
  AchievementEnum as GqlAchievement,
  PromoCodeType as GqlPromoCodeType,
  User as GqlUser,
  UserPromoCode as GqlPromoCode,
} from 'combat-mission-bridge';
import {AchievementEnum, PromoCode, User, UserPromoCode} from "../db";

/**
 * Маппим тип PromoCode в тип PromoCode, который используется в graphql.
 * @param promoCode
 */
export const mapPromoCode = (promoCode: PromoCode | UserPromoCode) => {
  const {type, openedAt, expiresAt, ...rest} = promoCode as PromoCode;
  const typeString: string = type;
  return {
    type: typeString as GqlPromoCodeType,
    openedAt: !openedAt ? null : openedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    ...rest,
  }
};

/**
 * Маппим тип User в тип User, который используется в graphql.
 * @param user
 */
export const mapUser = (user: User): User | GqlUser => {
  const {achievementsProgress, promoCodes, ...rest} = user;
  if (!achievementsProgress || !promoCodes) {
    return user;
  }
  const promoCodesInGql: GqlPromoCode[] = [];
  promoCodes.map((promoCode) => {
    promoCodesInGql.push(mapPromoCode(promoCode));
  });
  const achievementsProgressInGql: { achievementId: GqlAchievement; progress: number | null }[] = [];
  Object.keys(achievementsProgress).map((achievement, index) => {
    achievementsProgressInGql.push({
      achievementId: index as AchievementEnum,
      progress: achievementsProgress[index as AchievementEnum]
    });
  });
  return {
    achievementsProgress: achievementsProgressInGql,
    promoCodes: promoCodesInGql,
    ...rest
  };
};