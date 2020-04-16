import {Context} from '../types';
import {withErrorCatch} from './withErrorCatch';
import Database from '../../db/Database';

/**
 * Middleware which adds db in context
 */
export const withDatabase = ((db: Database) => {
  return withErrorCatch.createResolver(
    (root, args, context: Context) => {
      const {res} = context;
      res.locals.db = db;
      return root;
    }
  )
});