import {Context} from '../types';
import Database from '../../db/Database';
import {withErrorCatch} from "./withErrorCatch";

/**
 * Middleware which adds db in context
 */
export const withDatabase = (db: Database) => withErrorCatch.createResolver(
  (root: object, args: object, context: Context) => {
    const {res} = context;
    res.locals.db = db;
    return root;
  },
);