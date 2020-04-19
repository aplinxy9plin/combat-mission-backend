import {ApolloServer} from 'apollo-server-express';
import {
  schema,
  Query,
  Mutation,
} from "combat-mission-bridge";
import {AuthenticatedContext, Context, RootTypeResolvers} from './types';
import Database from '../db/Database';
import {withSignValidation} from "./middlewares/withSignValidation";
import {withDatabase} from "./middlewares/withDatabase";
import config from '../config';
import * as resolvers from './resolvers';

/**
 * Creates ApolloServer
 * @param {Database} db
 * @returns {ApolloServer}
 */
export function createApolloServer(db: Database) {
  const middlewares = withSignValidation.createResolver(withDatabase(db));
  const Query: RootTypeResolvers<Query> = {
    currentUser: resolvers.getCurrentUser(middlewares),
    userTeam: resolvers.getUserTeam(middlewares),
    user: resolvers.getUser(middlewares),
    profileMeta: resolvers.getProfileMeta(middlewares),
    mates: resolvers.searchMates(middlewares),
    achievements: resolvers.getAchievements(middlewares),
  };
  const Mutation: RootTypeResolvers<Mutation> = {
    activateCheck: resolvers.activateCheck(middlewares),
    saveProfile: resolvers.saveProfile(middlewares),
    deleteProfile: resolvers.deleteProfile(middlewares),
    registerUser: resolvers.registerUser(middlewares),
    joinTargetUser: resolvers.joinTargetUser(middlewares),
    leaveTeam: resolvers.leaveTeam(middlewares),
    openPromoCode: resolvers.openPromoCode(middlewares),
    getAchievementForPostSharing: resolvers.getAchievementForPostSharing(middlewares),
    getAchievementForGroupSubscription: resolvers.getAchievementForGroupSubscription(middlewares)
  };

  return new ApolloServer({
    typeDefs: schema,
    context: (ctx): Context => ctx,
    introspection: config.env === 'development',
    resolvers: {
      Query,
      Mutation,
      AchievementEnum: {
        TeamPlayer: 0,
        Visitor: 1,
        Correspondent: 2,
        LivingFullLife: 3,
        Warrior: 4,
        RichSoul: 5,
        BorderGuard: 6,
      },
      PromoCodeType: {
        Discount20VipFrom2Hours: 'discount 20 percents in VIP if duration more than 2 hrs',
      },
      UserPromoCode: {
        __resolveType(obj: any, context: AuthenticatedContext, info: any) {
          if (obj.value) {
            return 'UserOpenedPromoCode';
          }
          return 'UserClosedPromoCode';
        }
      }
    },
  });
}
