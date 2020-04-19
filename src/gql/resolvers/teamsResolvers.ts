import {AuthenticatedContext} from "../types";
import {isError, errorCodeMapper, BadRequestError, MappingError} from '../errors';
import * as teamService from '../../services/team-service';
import {createError} from "../utils/apollo";
import {mapUser} from "../../services/mapper";
import * as utils from '../../services/utils';
import {User} from "../../db";
import {Resolver} from "apollo-resolvers";

export const searchMates = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
    const {db, user} = context.res.locals;
    const {city, gamesIds} = args.searchFilter;
    if (
      !utils.isString(city)
      || utils.isEmptyString(city)
      || !Array.isArray(gamesIds)
      || !utils.isArrayContainsOnlyNumbers(gamesIds)
    ) {
      throw new BadRequestError();
    }
    return teamService.searchMates(db, city, gamesIds, user.id)
      .then((data) => {
        return !data ? null : data;
      });
  }
);

export const joinTargetUser = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
    const {db, user} = context.res.locals;
    const {targetUserId} = args;
    if (!utils.isNumber(targetUserId)) {
      throw new BadRequestError();
    }
    return teamService.joinTargetUser(db, user.id, targetUserId)
      .then((data) => {
        if (isError(data)) {
          const error = createError(errorCodeMapper[data.error.code], data.error.message);
          throw new error();
        }
        return data;
      });
  }
);

export const leaveTeam = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
  const {db, user} = context.res.locals;
  return teamService.leaveTeam(db, user.id)
    .then((data) => {
      return data;
    });
  },
);