import {Router} from 'express';
import axios from 'axios';
import * as https from 'https';
import {VerifiedResponse} from '../types';
import {Achievement, Collection, PromoCodeType, PromoCode} from '../../db';

import {getUserRanks} from './utils';
import {generatePromoCode} from '../../promo';

import userRouter from './userRouter';
import usersRouter from './usersRouter';
import teamsRouter from './teamsRouter';

const rootRouter = Router();
const http = axios.create({
  baseURL: 'https://colizeumarena.com/api/web',
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

rootRouter.use('/user', userRouter);
rootRouter.use('/users', usersRouter);
rootRouter.use('/teams', teamsRouter);

rootRouter.post('/register', async (req, res: VerifiedResponse) => {
  const {avatarUrl} = req.body;

  if (typeof avatarUrl !== 'string') {
    return res.status(400).json({error: 'Некорректные данные'});
  }

  const {db, user} = res.locals;
  const usersCollection = db.collection(Collection.Users);
  let foundUser = await usersCollection.findOne({id: user.id});

  let promoCode: PromoCode | null = null;

  if (!foundUser) {
    const ranks = await db.collection(Collection.Ranks).find({}).toArray();
    const {rank, nextRank} = getUserRanks(0, ranks);

    // Даем промокод за первое посещение приложения.
    promoCode = generatePromoCode(PromoCodeType.Discount20VipFrom2Hours);

    foundUser = {
      achievementsReceived: [],
      achievementsProgress: {
        [Achievement.Visitor]: 1,
        [Achievement.Warrior]: 0,
      },
      activatedChecks: [],
      avatarUrl,
      id: user.id,
      points: 100,
      promoCodes: [promoCode],
      lastFixedVisitDate: new Date().getTime(),
      visitsInRow: 0,
    };
    if (rank) {
      foundUser.rank = rank;
    }
    if (nextRank) {
      foundUser.nextRank = nextRank;
    }
    await usersCollection.insertOne(foundUser);
  }

  res.json({user: foundUser, newbiePromoReceived: true})
});

rootRouter.get('/clubs', async (req, res) => {
  const {data} = await http.get('/club/all');
  res.json(data);
});

rootRouter.get('/club', async (req, res: VerifiedResponse) => {
  const {tag} = req.query;
  const {data} = await http.get(`/club/get?tag=${tag}`);
  res.json(data);
});

rootRouter.get('/achievements', async (req, res: VerifiedResponse) => {
  const {db} = res.locals;
  res.json(await db.collection(Collection.Achievements).find().toArray());
});

rootRouter.get('/locations-info', async (req, res: VerifiedResponse) => {
  const {data} = await http.get('/key-value/locations');
  res.json(data);
});

/**
 * Возвращает справочники и прочие данные для анкеты.
 */
rootRouter.get('/profile-meta', async (req, res: VerifiedResponse) => {
  const {db} = res.locals;
  const gamesCollection = db.collection(Collection.Games);
  const stagesCollection = db.collection(Collection.Stages);

  const [games, stages] = await Promise.all([
    gamesCollection.find().toArray(),
    stagesCollection.find().toArray(),
  ]);

  res.json({games, stages});
});

export default rootRouter;
