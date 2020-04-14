import config from './config';

/**
 * Возвращает URL для статики.
 * @param ref
 */
export function getUrl(ref: string): string {
  const {staticBaseUrl} = config;
  const baseURL = staticBaseUrl.endsWith('/')
    ? staticBaseUrl
    : staticBaseUrl + '/';
  const formattedRef = ref.startsWith('/')
    ? ref.slice(1)
    : ref;

  return `${baseURL}${formattedRef}`.replace(/\\/g, '/');
}
