import {Router} from 'express';
import {VerifiedResponse} from '../types';
import {Collection, TeamUser} from '../../db';

const teamsRouter = Router();

/**
 * Попытка вступления в команду с каким-то пользователем.
 */
teamsRouter.post('/join', async (req, res: VerifiedResponse) => {
  const {targetUserId} = req.body;
  const {user, db} = res.locals;

  if (typeof targetUserId !== 'number' || targetUserId === user.id) {
    return res.status(400).json({error: 'Некорректные данные'});
  }
  const usersCollection = db.collection(Collection.Users);
  const teamsCollection = db.collection(Collection.Teams);

  // Находим информацию о пользователях.
  const users: TeamUser[] = await usersCollection
    .find({id: {$in: [user.id, targetUserId]}})
    .limit(2)
    .project({id: true, avatarUrl: true})
    .toArray();

  if (users.length !== 2) {
    return res.status(502).json({
      error: 'Какой-то из пользователей не был найден',
    });
  }
  const currentUser = users.find(u => u.id === user.id)!;
  const targetUser = users.find(u => u.id === targetUserId)!;

  // Находим текущую команду пользователя и команду пользователя к которому
  // хотят войти.
  const teams = await teamsCollection
    .find({'users.id': {$in: [user.id, targetUserId]}})
    .limit(2)
    .toArray();

  // Оба пользователя находятся в разных командах.
  if (teams.length === 2) {
    return res.status(502).json({
      error: 'Тот человек которого вы хотите пригласить уже находится в команде',
    });
  } else if (teams.length === 1) {
    const team = teams[0];
    const {_id, users} = team;

    // Проверяем, в одной ли команде пользователи.
    const usersInTeam = users.filter(u => {
      return u.id === user.id || u.id === targetUserId;
    });

    if (usersInTeam.length === 2) {
      return res.status(502).json({
        error: 'Вы уже в команде с этим пользователем',
      });
    }

    // Если в команде уже 5 человек, вступать туда нельзя.
    if (users.length === 5) {
      return res.status(502).json({
        error: 'Команда уже укомплектована',
      });
    }

    const currentUserInTeam = users.some(u => u.id === user.id);
    users.push({
      id: currentUserInTeam ? targetUser.id : currentUser.id,
      avatarUrl: currentUserInTeam ? targetUser.avatarUrl : currentUser.avatarUrl,
    });

    await teamsCollection.updateOne({_id}, {$set: {users}});
    return res.json(team)
  }

  // Создаем команду пользователей.
  const team = await teamsCollection.insertOne({users: [currentUser, targetUser]});
  res.json(team.ops[0]);
});

/**
 * Удаляет пользователя из команды.
 */
teamsRouter.post('/leave', async (req, res: VerifiedResponse) => {
  const {db, user} = res.locals;
  const teamsCollection = await db.collection(Collection.Teams);
  const team = await teamsCollection.findOne({'users.id': user.id});

  if (team) {
    const users = team.users.filter(u => u.id !== user.id);

    // Если в команде остался 1 человек, удаляем её.
    if (users.length === 1) {
      await teamsCollection.deleteOne({_id: team._id});
    }
    // Иначе удаляем пользователя из команды.
    else {
      await teamsCollection.updateOne({_id: team._id}, {
        $pull: {users: {id: user.id}},
      });
    }
  }

  res.json({data: true});
});

/**
 * Осуществляет поиск напарников
 */
teamsRouter.post('/mates', async (req, res: VerifiedResponse) => {
  const {city, gamesIds} = req.body;

  if (
    typeof city !== 'string'
    || !Array.isArray(gamesIds)
    || gamesIds.length === 0
    || gamesIds.some(id => typeof id !== 'number')
  ) {
    return res.status(400).json({error: 'Некорректные данные'});
  }
  const {db, user} = res.locals;
  const usersCollection = db.collection(Collection.Users);

  // Находим пользователей по запросу.
  const users = await usersCollection
    .find({
      id: {$ne: user.id},
      'profile.city': city,
      'profile.games.id': {$in: gamesIds},
    })
    .project({
      achievementsReceived: true,
      avatarUrl: true,
      id: true,
      profile: true,
      rank: true,
    })
    .toArray();

  // Если пользователи не найдены, возвращаем пустой массив.
  if (users.length === 0) {
    return res.json([]);
  }

  // Находим команды пользователей и оставляем только тех, кто находится не в
  // полных командах.
  const teamsCollection = db.collection(Collection.Teams);
  const teams = await teamsCollection
    .find({
      'users.id': {
        $in: users.map(u => u.id),
      },
    })
    .limit(users.length)
    .project({'users.id': true})
    .toArray();

  const filteredUsers = users.filter(u => {
    const team = teams.find(t => t.users.some(tu => tu.id === u.id));

    // Берем только те команды где менее 5 человек и нас в ней нет.
    return team
      ? (team.users.length < 5 && !team.users.some(u => u.id === user.id))
      : true;
  });
  res.json(filteredUsers);
});

export default teamsRouter;
