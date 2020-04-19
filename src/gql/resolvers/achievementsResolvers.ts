import * as achievementService from '../../services/achievement-service';
import {AuthenticatedContext} from "../types";
import {mapUser} from "../../services/mapper";
import {User} from "../../db";
import * as utils from '../../services/utils';
import {MappingError} from "../errors";
import {Resolver} from "apollo-resolvers";

export const getAchievements = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
    const {db} = context.res.locals;
    return achievementService.getAchievements(db);
  }
);

export const getAchievementForPostSharing = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
    const {db, user} = context.res.locals;
    return achievementService.processPostSharing(db, user.id)
      .then((data) => {
        const mappedUser = mapUser(data.user as User);
        if (utils.isUser(mappedUser)) {
          throw new MappingError();
        }
        return {
          user: mappedUser,
          promoReceived: data.promoReceived,
        }
      });
  }
);

export const getAchievementForGroupSubscription = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
    const {db, user} = context.res.locals;
    return achievementService.processGroupSubscription(db, user.id)
      .then((data) => {
        const mappedUser = mapUser(data.user as User);
        if (utils.isUser(mappedUser)) {
          throw new MappingError();
        }
        return {
          user: mappedUser,
          promoReceived: data.promoReceived,
        }
      });
  }
);