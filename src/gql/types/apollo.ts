import {Request, Response} from 'express';
import Database from '../../db/Database';
import {Resolver} from 'apollo-resolvers';
import {Socket} from 'socket.io'

/**
 * Модифицрованное тело ответа.
 */
export interface IResponse<T extends {} = {}> extends Response {
  locals: {
    db: Database;
  } & T;
}

/**
 * Ответ, в котором есть текущий пользователь.
 */
export interface VerifiedResponse extends IResponse<{user: {id: number}}> {
}

/**
 * Context base
 */
export interface Context {
  req: Request;
  res: IResponse;
}

/**
 * Context where user is verified
 */
export type AuthenticatedContext = {
  req: Request;
  res: VerifiedResponse;
}

/**
 * Resolvers description of type
 */
export type RootTypeResolvers<Type extends {}> = {
  [K in keyof Type]: Resolver<Type[K]>;
}

/**
 * Resolvers description of Subscription type
 */
export type SubscriptionTypeResolvers<Type extends {}> = {
  [K in keyof Type]: {
    resolver?: Resolver<Type[K]>;
    subscription: Resolver<Type[K]>;
  };
};
