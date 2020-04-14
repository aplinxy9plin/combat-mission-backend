import {Router} from 'express';
import {VerifiedResponse} from '../types';
import {Collection} from '../../db';

const usersRouter = Router();

usersRouter.get('/:id', async (req, res: VerifiedResponse) => {
  const {id} = req.params;
  const idNum = Number(id);

  if (Number.isNaN(idNum)) {
    return res.status(400).json({error: 'Некорректные данные'});
  }
  const {db} = res.locals;
  const user = await db.collection(Collection.Users).findOne({id: idNum}, {
    projection: {
      achievementsReceived: true,
      avatarUrl: true,
      id: true,
      profile: true,
      rank: true,
    },
  });
  res.json(user);
});

export default usersRouter;
