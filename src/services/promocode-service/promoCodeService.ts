import Database, {
  PromoCodeType,
  PromoCode,
  UserPromoCode, User, Collection,
} from '../../db';
import dayjs from 'dayjs';

const titleMap: Record<PromoCodeType, string> = {
  [PromoCodeType.Discount20VipFrom2Hours]: '- 20% в VIP-зал при посещении ' +
  'от 2 часов',
};

/**
 * Генерирует промокод указанного типа.
 */
export const generatePromoCode = (type: PromoCodeType): PromoCode => {
  return {
    id: Math.random().toString(16).slice(-8),
    type,
    title: titleMap[type],
    value: Math.random().toString(16).slice(-10),
    openedAt: null,
    expiresAt: dayjs().add(7, 'day').toDate(),
  }
};

/**
 * Форматирует код для вывода пользователю
 * @param {PromoCode} code
 * @returns {UserPromoCode}
 */
export const formatPromoCode = (code: PromoCode): UserPromoCode => {
  const {id, type, expiresAt, title, openedAt} = code;

  if (openedAt) {
    return code;
  }
  return {id, type, expiresAt, title, openedAt};
};

/**
 * Форматирует пользователя оставляя только те промокоды, которые сейчас активны
 * @param {User} user
 * @returns {User}
 */
export const formatUserWithPromo = (user: User) => {
  const {promoCodes, ...rest} = user;
  const now = dayjs();

  return {
    ...rest,
    promoCodes: promoCodes
      .filter(c => now.isBefore(c.expiresAt))
      .map(formatPromoCode),
  }
};

/**
 * Активировать промокод пользователя
 * @param db
 * @param userId
 * @param promoCodeId
 */
export const openPromoCode = async (db: Database, userId: number, promoCodeId: string) => {
  const foundUser = await db.collection(Collection.Users).findOne({id: userId});

  if (!foundUser) {
    return {
      error: {
        code: 404,
        message: 'Пользователь не найден',
      }
    };
  }
  const promo = foundUser.promoCodes.find(p => p.id === promoCodeId);

  if (!promo) {
    return {
      error: {
        code: 404,
        message: 'Промокод не найден',
      }
    };
  }
  if (!promo.openedAt) {
    const index = foundUser.promoCodes.indexOf(promo);
    const now = dayjs();
    promo.openedAt = now.toDate();
    promo.expiresAt = now.add(1, 'day').toDate();

    await db.collection(Collection.Users).updateOne(
      {id: userId},
      {
        $set: {
          [`promoCodes.${index}.openedAt`]: promo.openedAt,
          [`promoCodes.${index}.expiresAt`]: promo.expiresAt,
        },
      },
    );
  }
  // TODO
  return promo;//formatPromoCode(promo);
};
