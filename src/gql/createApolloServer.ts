import {ApolloServer} from 'apollo-server-express';
import {
  schema,
  Query,
  Mutation,
  User as GqlUser,
} from "combat-mission-bridge";
import {withDatabase} from "./middlewares/withDatabase";
import {Context, RootTypeResolvers, SubscriptionTypeResolvers, isError} from './types';
import Database from '../db/Database';
import config from '../config';
import * as achievementService from '../services/achievement-service';
import * as userService from '../services/user-service';
import * as teamService from '../services/team-service';
import * as promoCodeService from '../services/promocode-service';
import {AchievementEnum, UserTest} from "../db";
import {mapUserFromMongoToGQLFormat} from "../services/mapper";
import {UnknownError} from "./errors";
import * as utils from '../services/utils';

type TestQuery = {};
type TestMutation = {};

/**
 * Creates ApolloServer
 * @param {Database} db
 * @returns {ApolloServer}
 */
export function createApolloServer(db: Database) {
  const Query: RootTypeResolvers<Query> = {
    currentUser: withDatabase(db).createResolver(
      async (root, args, context: Context) => {
        const {user, receivedPromoCodes} = await userService.getCurrentUserInfo(db, 1);
        if (!user || !receivedPromoCodes) {
          throw new UnknownError();
        }
        return {
          user: mapUserFromMongoToGQLFormat(user),
          receivedPromoCodes
        }
      },
    ),
    userTeam: withDatabase(db).createResolver(
      (root, args, context: Context) => {
        return userService.getUserTeam(db, 1);
      }
    ),
    user: withDatabase(db).createResolver(
      async (root, args, context: Context) => {
        const user = await userService.getUser(db, args.id);
        if (!user) {
          throw new UnknownError();
        }
        const userData = mapUserFromMongoToGQLFormat(user);
        return userData;
      }
    ), // OK.
    profileMeta: withDatabase(db).createResolver(
      (root, args, context: Context) => {
        return userService.getProfileMeta(db);
      }
    ), // OK.
    mates: withDatabase(db).createResolver(
      async (root, args, context: Context) => {
        const {city, gamesIds} = args.searchFilter;
        const mates = await teamService.searchMates(db, city, gamesIds, 1);
        if (!(Array.isArray(mates) && mates.length)) {
          throw new UnknownError();
        }
        return mates.map(x => mapUserFromMongoToGQLFormat(x));
      }
    ),
    achievements: withDatabase(db).createResolver(
       (root, args, context: Context) => {
        return achievementService.getAchievements(db);
      }
    ), // OK.
  };
  const Mutation: RootTypeResolvers<Mutation> = {
    activateCheck: withDatabase(db).createResolver(
      async (root, args, context: Context) => {
        const check = args.check;
        if (!utils.isString(check) || utils.isEmptyString(check)) {
          throw new UnknownError();
        }
        const {error, ...rest} = await userService.activateCheck(args.check, db, 1);
        const {message, activated, user, promoReceived} = rest;
        if (error || !message || !activated || !user || !promoReceived) {
          throw new UnknownError();
        }
        return {
          message,
          activated,
          user: mapUserFromMongoToGQLFormat(user),
          promoReceived
        }
      },
    ),
    saveProfile: withDatabase(db).createResolver(
      async (root, args, context: Context) => {
        const result = await userService.saveProfile(args.profile, db, 1);
        if (isError(result)) {
          throw new UnknownError();
        }
        return result;
      },
    ),
    deleteProfile: withDatabase(db).createResolver(
      (root, args, context: Context) => {
        return userService.deleteProfile(db, 1);
      }
    ),
    registerUser: withDatabase(db).createResolver(
      async (root, args, context: Context) => {
        const {user, newbiePromoReceived} = await userService.registerUser(db, 1, '');
        const userData: GqlUser = mapUserFromMongoToGQLFormat(user);
        return {user: userData, newbiePromoReceived};
      }
    ), // OK.
    joinTargetUser: withDatabase(db).createResolver(
      async (root, args, context: Context) => {
        const result = await teamService.joinTargetUser(db, 1, 2);
        if (isError(result)) {
          throw new UnknownError();
        }
        return result;
      }
    ),
    leaveTeam: withDatabase(db).createResolver(
      async (root, args, context: Context) => {
        const {data} = await teamService.leaveTeam(db, 1)
        return data;
      }
    ),
    // TODO возвращаемый тип должен быть UserPromoCode
    /*openPromoCode: withDatabase(db).createResolver(
      async (root, args, context: Context) => {
        const result = await promoCodeService.openPromoCode(db, 1, args.promoCodeId);
        if (isError(result)) {
          throw new UnknownError();
        }
        return result;
      }
    )*/
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
      }
    },
  });
}
