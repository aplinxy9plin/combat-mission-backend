import {User as GqlUser} from "combat-mission-bridge";
import {AuthenticatedContext} from "../types";
import {getUnknownError, isError, errorCodeMapper, BadRequestError} from '../errors';
import * as userService from '../../services/user-service';
import {createError} from "../utils/apollo";
import {mapUser} from "../../services/mapper";
import * as utils from '../../services/utils';

export const getCurrentUser = (root: any, args: any, context: AuthenticatedContext) => {
  const {db, user} = context.res.locals;
  return userService.getCurrentUserInfo(db, user.id)
    .then((data) => {
      if (isError(data)) {
        const error = createError(errorCodeMapper[data.error.code], data.error.message);
        throw new error();
      }
      return {
        user: mapUser(data.user),
        receivedPromoCodes: data.receivedPromoCodes,
      }
    });
};

export const getUserTeam = (root: any, args: any, context: AuthenticatedContext) => {
  const {db, user} = context.res.locals;
  return userService.getUserTeam(db, user.id);
};

export const getUser = (root: any, args: any, context: AuthenticatedContext) => {
  const {db} = context.res.locals;
  const {userId} = args;
  if (!Number.isInteger(userId)) {
    throw new BadRequestError();
  }
  return userService.getUser(db, userId)
    .then((data) => {
      if (!data) {
        const error = createError(errorCodeMapper[404], 'Пользователь не найден');
        throw new error;
      }
      return mapUser(data);
    })
};

export const getProfileMeta = (root: any, args: any, context: AuthenticatedContext) => {
  const {db} = context.res.locals;
  return userService.getProfileMeta(db);
};

export const activateCheck = (root: any, args: any, context: AuthenticatedContext) => {
  const {db, user} = context.res.locals;
  const {check} = args;
  if (!utils.isString(check) || utils.isEmptyString(check)) {
    const error = createError(errorCodeMapper[400], 'Чек не указан');
    throw new error();
  }
  return userService.activateCheck(check, db, user.id)
    .then((data) => {
      if (isError(data)) {
        const error = createError(errorCodeMapper[data.error.code], data.error.message);
        throw new error();
      }
      const {message, activated, user, promoReceived} = data;
      return {
        message,
        activated,
        user: !user ? null : mapUser(user),
        promoReceived,
      }
    })
};

export const saveProfile = (root: any, args: any, context: AuthenticatedContext) => {
  const {db, user} = context.res.locals;
  const {age, about, city, clubId, gamesIds, playTime, stageId} = args.profile;
  if (
    !utils.isNumber(age)
    || age < 14
    || age > 100
    || !utils.isString(city)
    || utils.isEmptyString(city)
    || !utils.isNumber(clubId)
    || !Array.isArray(gamesIds)
    || gamesIds.some(g => !utils.isNumber(g))
    || !utils.isNumber(playTime)
    || !utils.isNumber(stageId)
    || (typeof about !== 'undefined' && typeof about !== 'string')
  ) {
    throw new BadRequestError();
  }
  return userService.saveProfile(args.profile, db, user.id)
    .then((data) => {
      if (isError(data)) {
        const error = createError(errorCodeMapper[data.error.code], data.error.message);
        throw new error();
      }
      return data;
    });
};

export const deleteProfile = (root: any, args: any, context: AuthenticatedContext) => {
  const {db, user} = context.res.locals;
  return userService.deleteProfile(db, user.id);
};

export const registerUser = (root: any, args: any, context: AuthenticatedContext) => {
  const {db, user} = context.res.locals;
  const {avatarUrl} = args.user;
  if (!utils.isString(avatarUrl)) {
    throw new BadRequestError();
  }
  return userService.registerUser(db, user.id, avatarUrl)
    .then((data) => {
      return {
        user: mapUser(data.user),
        newbiePromoReceived: data.newbiePromoReceived,
      }
    });
};