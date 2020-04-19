/**
 * List of errors which server can return
 */
export enum ApolloError {
  Authorization = 'AuthorizationError',
  Unknown = 'UnknownError',
  NotFound = 'NotFoundError',
  BadRequest = 'BadRequestError',
  Mapping = 'MappingError',
}

export type Error = {
  error: {
    code: number;
    message: string;
  };
}

export type CheckActivationError = {
  error: {
    code: number;
    message: string;
    activated: boolean;
  };
}