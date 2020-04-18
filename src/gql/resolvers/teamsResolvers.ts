import {AuthenticatedContext} from "../types";
import {isError, errorCodeMapper, BadRequestError} from '../errors';
import * as teamService from '../../services/team-service';
import {createError} from "../utils/apollo";
import {mapUser} from "../../services/mapper";
import * as utils from '../../services/utils';

export const searchMates = (root: any, args: any, context: AuthenticatedContext) => {
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
      return !data ? null : data.map(x => mapUser(x));
    });
};

export const joinTargetUser = (root: any, args: any, context: AuthenticatedContext) => {
  const {db, user} = context.res.locals;
  const {targetUserId} = args;
  if (!utils.isNumber(targetUserId)) {
    throw new BadRequestError();
  }
  return teamService.joinTargetUser(db, user.id, targetUserId)
    .then((data) => {
      if (isError(data)) {
        const error = createError(errorCodeMapper[data.error.code], data.error.message);
      }
      return data;
    });
};

export const leaveTeam = (root: any, args: any, context: AuthenticatedContext) => {
  const {db, user} = context.res.locals;
  return teamService.leaveTeam(db, user.id)
    .then((data) => {
      return data;
    });
};