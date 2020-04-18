import * as promoCodeService from '../../services/promocode-service';
import * as utils from '../../services/utils';
import {AuthenticatedContext} from "../types";
import {BadRequestError, errorCodeMapper, isError} from "../errors";
import {createError} from "../utils/apollo";
import {isOpenedPromoCode, UserPromoCode} from "../../db";
import {mapPromoCode} from "../../services/mapper";

export const openPromoCode = (root: any, args: any, context: AuthenticatedContext) => {
  const {db, user} = context.res.locals;
  const {promoCodeId} = args;
  if (!utils.isString(promoCodeId) || utils.isEmptyString(promoCodeId)) {
    throw new BadRequestError();
  }
  return promoCodeService.openPromoCode(db, user.id, promoCodeId)
    .then((data) => {
      if (isError(data)) {
        const error = createError(errorCodeMapper[data.error.code], data.error.message);
        throw new error();
      }
      return mapPromoCode(data);
    })
};