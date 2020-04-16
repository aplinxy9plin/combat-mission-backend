import Database, {Collection, TeamUser} from "../../db";

/**
 * Пытаемся вступить в команду с каким-то пользователем
 * @param db
 * @param userId
 * @param targetUserId
 */
export const tryJoinInTeam = async (db: Database, userId: number, targetUserId: number) => {
  const usersCollection = db.collection(Collection.Users);
  const teamsCollection = db.collection(Collection.Teams);

  // Находим информацию о пользователях.
  const users: TeamUser[] = await usersCollection
    .find({id: {$in: [userId, targetUserId]}})
    .limit(2)
    .project({id: true, avatarUrl: true})
    .toArray();

  if (users.length !== 2) {
    return {
      error: {
        code: 502,
        message: 'Какой-то из пользователей не был найден',
      }
    };
  }
  const currentUser = users.find(u => u.id === userId)!;
  const targetUser = users.find(u => u.id === targetUserId)!;

  // Находим текущую команду пользователя и команду пользователя к которому
  // хотят войти.
  const teams = await teamsCollection
    .find({'users.id': {$in: [userId, targetUserId]}})
    .limit(2)
    .toArray();

  // Оба пользователя находятся в разных командах.
  if (teams.length === 2) {
    return {
      error: {
        code: 502,
        message: 'Тот человек которого вы хотите пригласить уже находится в команде',
      }
    };
  } else if (teams.length === 1) {
    const team = teams[0];
    const {_id, users} = team;

    // Проверяем, в одной ли команде пользователи.
    const usersInTeam = users.filter(u => {
      return u.id === userId || u.id === targetUserId;
    });

    if (usersInTeam.length === 2) {
      return {
        error: {
          code: 502,
          message: 'Вы уже в команде с этим пользователем',
        }
      };
    }

    // Если в команде уже 5 человек, вступать туда нельзя.
    if (users.length === 5) {
      return {
        error: {
          code: 502,
          message: 'Команда уже укомплектована',
        }
      };
    }

    const currentUserInTeam = users.some(u => u.id === userId);
    users.push({
      id: currentUserInTeam ? targetUser.id : currentUser.id,
      avatarUrl: currentUserInTeam ? targetUser.avatarUrl : currentUser.avatarUrl,
    });

    await teamsCollection.updateOne({_id}, {$set: {users}});
    return team;
  }

  // Создаем команду пользователей.
  const team = await teamsCollection.insertOne({users: [currentUser, targetUser]});
  return team.ops[0];
};