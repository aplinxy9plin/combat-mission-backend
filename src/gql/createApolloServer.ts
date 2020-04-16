import {ApolloServer} from 'apollo-server-express';
import {Query as queryType, schema as rawSchema, GetGamesQuery} from 'combat-mission-bridge'
import {withDatabase} from "./middlewares/withDatabase";
import {Context, RootTypeResolvers, SubscriptionTypeResolvers} from './types';
import Database from '../db/Database';
import config from '../config';
import {Collection} from "../db";

/**
 * Here we should import types Query, Mutation and Subscription from bridge
 * and replace these below. Moreover, it is needed to import text
 * representation of schema and use it in typeDefs.
 */
type Query = GetGamesQuery;
const schema = `
type Query {
  test: Boolean!
}
type Mutation {
  test: Boolean!
}
type Subscription {
  test: Boolean!
}
`;

/**
 * Creates ApolloServer
 * @param {Database} db
 * @returns {ApolloServer}
 */
export function createApolloServer(db: Database) {
  const Query: RootTypeResolvers<Query> = {
    games: withDatabase(db).createResolver(
      (root, args, context: Context) => {
        const {res} = context;
        const {db} = res.locals;
        return db.collection(Collection.Games).find().toArray();
      }
    )
  };

  return new ApolloServer({
    typeDefs: rawSchema,
    context: (ctx): Context => ctx,
    introspection: config.env === 'development',
    resolvers: {
      Query
    },
  });
}
