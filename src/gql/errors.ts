import {createError} from './utils/apollo';
import {ApolloError, CheckActivationError, Error} from './types';

export const AuthorizationError = createError(ApolloError.Authorization, 'Ошибка авторизации');
export const UnknownError = createError(ApolloError.Unknown, 'Неизвестная ошибка');
export const BadRequestError = createError(ApolloError.BadRequest, 'Некоректные данные');
export const MappingError = createError(ApolloError.Mapping, 'Ошибка маппинга данных');

export const getUnknownError = (errorMessage: string) => {
  return createError(ApolloError.Unknown, errorMessage);
};

export const isError = (item: any): item is Error => {
  return item.hasOwnProperty('error');
};

export const isCheckActivationError = (item: any): item is CheckActivationError => {
  return item.hasOwnProperty('error');
};

export const errorCodeMapper: Record<number, ApolloError> = {
  400: ApolloError.BadRequest,
  404: ApolloError.NotFound,
};