import {Response} from 'express';
import Database from '../db/Database';
import {Socket} from 'socket.io';

/**
 * Описание серверного конфига
 */
export interface IConfig {
  env: string;
  encryptionSecret: string;
  port: number;
  root: string;
  dbName: string;
  dbHost: string;
  dbPort: number;
  staticBaseUrl: string;
  vkAppSecretKey: string;
}

/**
 * Подифицрованное тело ответа.
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
 * Информация необходимая для создания профиля.
 */
export interface ProfileCreateData {
  age: number;
  about?: string;
  city: string;
  clubId: number;
  gamesIds: number[];
  playTime: number;
  stageId: number;
}
