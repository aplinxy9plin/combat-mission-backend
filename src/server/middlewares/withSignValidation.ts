import {NextFunction, Request} from 'express';
import {VerifiedResponse} from '../types';
import {isSignValid} from '../utils';

/**
 * Миддлвара для проверки подписи пользователя.
 * @param req
 * @param res
 * @param next
 */
function withSignValidation(
  req: Request,
  res: VerifiedResponse,
  next: NextFunction,
) {
  const params = req.header('X-Launch-params');

  if (typeof params === 'string') {
    const result = isSignValid(params);

    if (result.valid) {
      res.locals.user = {
        id: result.userId,
      };
      return next();
    }
  }
  res.sendStatus(401);
}

export default withSignValidation;
