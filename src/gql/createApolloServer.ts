import {ApolloServer} from 'apollo-server-express';
import {and} from 'apollo-resolvers';
import {
  schema,
  Query,
  Mutation,
  User as GqlUser,
} from "combat-mission-bridge";
import {Context, RootTypeResolvers, SubscriptionTypeResolvers, isError} from './types';
import Database from '../db/Database';
import config from '../config';
import * as achievementService from '../services/achievement-service';
import * as userService from '../services/user-service';
import * as teamService from '../services/team-service';
import * as promoCodeService from '../services/promocode-service';
import {AchievementEnum, UserTest} from "../db";
import {mapUser} from "../services/mapper";
import {UnknownError} from "./errors";
import * as utils from '../services/utils';
import * as usersResolvers from "./resolvers/usersResolvers";
import * as teamsResolvers from './resolvers/teamsResolvers';
import * as achievementsResolvers from './resolvers/achievementsResolvers';
import {withSignValidation, withDatabase, withSignValidationAndDb} from "./middlewares";

type TestQuery = {};
type TestMutation = {};

/**
 * Creates ApolloServer
 * @param {Database} db
 * @returns {ApolloServer}
 */
export function createApolloServer(db: Database) {
  const Query: RootTypeResolvers<Query> = {
    currentUser: withSignValidationAndDb(db).createResolver(usersResolvers.getCurrentUser),
    userTeam: withSignValidationAndDb(db).createResolver(usersResolvers.getUserTeam),
    user: withSignValidationAndDb(db).createResolver(usersResolvers.getUser),
    profileMeta: withSignValidationAndDb(db).createResolver(usersResolvers.getProfileMeta),
    mates: withSignValidationAndDb(db).createResolver(teamsResolvers.searchMates),
    achievements: withSignValidationAndDb(db).createResolver(achievementsResolvers.getAchievements),
  };
  const Mutation: RootTypeResolvers<TestMutation> = {
    activateCheck: withSignValidationAndDb(db).createResolver(usersResolvers.activateCheck),
    saveProfile: withSignValidationAndDb(db).createResolver(usersResolvers.saveProfile),
    deleteProfile: withSignValidationAndDb(db).createResolver(usersResolvers.deleteProfile),
    registerUser: withSignValidationAndDb(db).createResolver(usersResolvers.registerUser),
    joinTargetUser: withSignValidationAndDb(db).createResolver(teamsResolvers.joinTargetUser),
    leaveTeam: withSignValidationAndDb(db).createResolver(teamsResolvers.leaveTeam),
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
