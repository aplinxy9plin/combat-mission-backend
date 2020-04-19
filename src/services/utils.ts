import {User} from "../db";

/**
 * Проверяет, является ли значение числом.
 * @param value
 */
export const isNumber = (value: any): value is number => {
  return typeof value === 'number';
};

/**
 * Проверяет, является ли значение строкой.
 * @param value
 */
export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

/**
 * Проверяет, является ли значение пустой строкой
 * @param value
 */
export const isEmptyString = (value: string): boolean => {
  return value.length === 0;
};

/**
 * Проверяет, является ли массив пустым
 * @param value
 */
export const isEmptyArray = (value: any): boolean => {
  return !(Array.isArray(value) && value.length);
};

export const isArrayContainsOnlyNumbers = (array: any[]): boolean => {
  return array.some(x => isNumber(x));
};

export const isUser = (value: any): value is User => {
  return value.hasOwnProperty('profile');
};

export const isObject = (value: any): boolean => {
  return typeof value === 'object';
};