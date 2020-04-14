import {Admin, Collection, Db} from 'mongodb';
import {
  DbSchema,
  TDbSchemaKey,
  TDbSchemaCollection,
} from './types';

class Database {
  private readonly db: Db;

  public constructor(db: Db) {
    this.db = db;
  }

  /**
   * Создает новую коллекцю.
   * @param name
   */
  public createCollection<Name extends TDbSchemaKey>(
    name: Name,
  ): Promise<Collection<DbSchema[Name]>> {
    return this.db.createCollection<DbSchema[Name]>(String(name));
  }

  /**
   * Возвращает коллекцию.
   * @param name
   */
  public collection<Name extends TDbSchemaKey>(
    name: Name,
  ): Collection<DbSchema[Name]> {
    return this.db.collection<DbSchema[Name]>(String(name));
  }
}

export default Database;
