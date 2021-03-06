import {AuthenticatedContext} from '../types';
import {isSignValid} from '../../http/utils';
import {AuthorizationError} from '../errors';
import {withErrorCatch} from "./withErrorCatch";

/**
 * Middleware which adds user id in context
 * @type {Resolver<unknown>}
 */
export const withSignValidation = withErrorCatch.createResolver(
(root: object, args: object, context: AuthenticatedContext) => {
  const {req} = context;
  const params = req.header('X-Launch-params');

  if (typeof params === 'string') {
    const result = isSignValid(params);

    if (result.valid) {
      context.res.locals.user = {id: result.userId};
      return root;
    }
  }
  throw new AuthorizationError();
  },
);