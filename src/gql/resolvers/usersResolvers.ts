import {Resolver} from "apollo-resolvers";
import {ReceivedPromoCode} from 'combat-mission-bridge'
import {AuthenticatedContext} from "../types";
import {isError, errorCodeMapper, BadRequestError, MappingError} from '../errors';
import * as userService from '../../services/user-service';
import {createError} from "../utils/apollo";
import {mapUser} from "../../services/mapper";
import * as utils from '../../services/utils';
import {User} from "../../db";

export const getCurrentUser = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  async (root: any, args: any, context: AuthenticatedContext) => {
    const {db, user} = context.res.locals;
    const data = await userService.getCurrentUserInfo(db, user.id);
    if (isError(data)) {
      const error = createError(errorCodeMapper[data.error.code], data.error.message);
      throw new error();
    }
    const receivedPromoCodesInGql: ReceivedPromoCode[] = [];
    data.receivedPromoCodes.map(x => {
      receivedPromoCodesInGql.push((x as ReceivedPromoCode));
    });
    const mappedUser = mapUser((data.user as User));
    if (utils.isUser(mappedUser)) {
      throw new MappingError();
    }
    return {
      user: mappedUser,
      receivedPromoCodes: receivedPromoCodesInGql,
    };
  }
);

export const getUserTeam = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
    const {db, user} = context.res.locals;
    return userService.getUserTeam(db, user.id);
  }
);

export const getUser = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
    const {db} = context.res.locals;
    const {id} = args;
    if (!Number.isInteger(id)) {
      throw new BadRequestError();
    }
    return userService.getUser(db, id)
      .then((data) => {
        if (!data) {
          const error = createError(errorCodeMapper[404], 'Пользователь не найден');
          throw new error;
        }
        return data;
      })
  }
);

export const getProfileMeta = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
    const {db} = context.res.locals;
    return userService.getProfileMeta(db);
  }
);

export const activateCheck = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
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
        const mappedUser = mapUser(user as User);
        if (utils.isUser(mappedUser)) {
          throw new MappingError();
        }
        return {
          message,
          activated,
          user: !user ? null : mappedUser,
          promoReceived,
        }
      })
  }
);

export const saveProfile = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
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
      || !utils.isArrayContainsOnlyNumbers(gamesIds)
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
  }
)

export const deleteProfile = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
    const {db, user} = context.res.locals;
    return userService.deleteProfile(db, user.id);
  }
);

export const registerUser = (baseResolver: Resolver<object>) => baseResolver.createResolver(
  (root: any, args: any, context: AuthenticatedContext) => {
    const {db, user} = context.res.locals;
    const {avatarUrl} = args.user;
    if (!utils.isString(avatarUrl)) {
      throw new BadRequestError();
    }
    return userService.registerUser(db, user.id, avatarUrl)
      .then((data) => {
        const mappedUser = mapUser(data.user as User);
        if (utils.isUser(mappedUser)) {
          throw new MappingError();
        }
        return {
          user: mappedUser,
          newbiePromoReceived: data.newbiePromoReceived,
        }
      });
  }
);