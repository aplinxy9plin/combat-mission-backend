import config from '../config';
import {MongoClient} from 'mongodb';
import Database from './Database';

const {dbPort, dbHost} = config;

/**
 * Создает клиент Mongo.
 */
export function createMongoClient(): MongoClient {
  const connectionString = `mongodb://${dbHost}:${dbPort}`;
  return new MongoClient(connectionString, {useUnifiedTopology: true});
}

/**
 * Создаем обертку для работы с БД относительно клиента.
 * @param client
 */
export function createDb(client: MongoClient): Database {
  return new Database(client.db(config.dbName))
}
