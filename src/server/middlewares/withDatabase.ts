import {NextFunction, Request} from 'express';
import {IResponse} from '../types';
import Database from '../../db/Database';

/**
 * Добавляет базу данных в тело запроса.
 */
function withDatabase(db: Database) {
  return (req: Request, res: IResponse, next: NextFunction) => {
    res.locals.db = db;
    next();
  };
}

export default withDatabase;
