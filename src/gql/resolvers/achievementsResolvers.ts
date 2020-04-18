import * as achievementService from '../../services/achievement-service';
import {AuthenticatedContext} from "../types";

export const getAchievements = (root: any, args: any, context: AuthenticatedContext) => {
  const {db} = context.res.locals;
  return achievementService.getAchievements(db);
};