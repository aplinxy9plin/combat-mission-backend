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

export function isObject(value: any): boolean {
  return typeof value === 'object';
}