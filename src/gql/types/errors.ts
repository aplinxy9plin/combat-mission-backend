/**
 * List of errors which server can return
 */
export enum ApolloError {
  Authorization = 'AuthorizationError',
  Unknown = 'UnknownError',
}

export type Error = {
  error: {
    code: number;
    message: string;
  };
}

export const isError = (item: any): item is Error => {
  return item.hasOwnProperty('error');
};