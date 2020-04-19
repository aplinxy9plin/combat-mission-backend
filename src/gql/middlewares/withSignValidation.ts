import {AuthenticatedContext, Context} from '../types';
import {isSignValid} from '../../http/utils';
import {AuthorizationError} from '../errors';
import {withErrorCatch} from "./withErrorCatch";

/**
 * Middleware which adds user id in context
 * @type {Resolver<unknown>}
 */
export const withSignValidation = withErrorCatch.createResolver(
(root: object, args: object, context: AuthenticatedContext) => {
  console.log(context.req.header('check'));
  context.res.locals.user = {
    id: 4
  };
  return root;
  /*const {req} = context;
  const params = req.header('X-Launch-params');

  if (typeof params === 'string') {
    const result = isSignValid(params);

    if (result.valid) {
      context.res.locals.user = {id: result.userId};
      return root;
    }
  }
  throw new AuthorizationError();*/
  },
);