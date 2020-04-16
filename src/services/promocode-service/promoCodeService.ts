import {
  PromoCodeType,
  PromoCode,
  UserPromoCode, User,
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
