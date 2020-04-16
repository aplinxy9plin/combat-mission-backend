import * as qs from 'querystring';
import * as crypto from 'crypto';
import config from '../config';

export interface ISignContent {
  userId: number;
}

type TSignValidationResult = {valid: false} | ({valid: true} & ISignContent);

/**
 * Проверяет валидность подписи пользователя.
 * @param queryString
 */
export function isSignValid(queryString: string): TSignValidationResult {
  const query = qs.parse(queryString);
  const ordered = Object.keys(query)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      const value = query[key];
      // Берем только ключи начинающиеся с vk_
      if (key.slice(0, 3) === 'vk_' && typeof value === 'string') {
        acc[key] = value;
      }
      return acc;
    }, {});

  const stringParams = qs.stringify(ordered);
  const paramsHash = crypto
    .createHmac('sha256', config.vkAppSecretKey)
    .update(stringParams)
    .digest()
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=$/, '');

  if (paramsHash !== query.sign) {
    return {valid: false};
  }
  return {
    valid: true,
    userId: Number(query.vk_user_id),
  }
}
