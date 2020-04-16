import {Achievement, Collection} from '../../db';
import Database from '../../db/Database';
import dayjs from "dayjs";
import {formatUserWithPromo} from '../promocode-service';
import {checkIfUserReceivedUpgradeByTotalVisits, checkIfUserLogsInSomeDayInRow} from "./utils";

export const getCurrentUserInfo = async (db: Database, userId: number) => {
  const usersCollection = db.collection(Collection.Users);
  const foundUser = await usersCollection.findOne({id: userId});

  if (!foundUser) {
    return {error: 'пользователь не найден'};
  }

  // Мы выдаем промо в зависимости того, был получен новый уровень или нет.
  const receivedPromoCodes: Array<'warrior' | 'visitor'> = [];

  const lastFixedVisit = dayjs(foundUser.lastFixedVisitDate);
  const now = dayjs();
  const lastDate = lastFixedVisit.get('date');
  const nowDate = now.get('date');
  const diff = Math.abs(nowDate - lastDate);

  if (diff >= 1) {
    const {Visitor, Warrior} = Achievement;
    const achievements = await db.collection(Collection.Achievements)
      .find({}).toArray();
    const ranks = await db.collection(Collection.Ranks).find({}).toArray();
    const warriorAchievement = achievements.find(a => a.id === Warrior);
    const visitorAchievement = achievements.find(a => a.id === Visitor);
    const {achievementsProgress} = foundUser;
    const visitsCount = achievementsProgress[Visitor] || 1;
    const nextVisitsCount = visitsCount + 1;

    foundUser.lastFixedVisitDate = now.unix() * 1000;
    achievementsProgress[Visitor] = nextVisitsCount;

    // Проверяем, получил ли апгрейд по общему числу посещений.
    if (visitorAchievement && ranks) {
      checkIfUserReceivedUpgradeByTotalVisits(foundUser, receivedPromoCodes, visitorAchievement, ranks);
    }

    // Если есть разница в 1 день, значит пользователь заходит какой-то день
    // подряд. С этим есть связанные ачивки.
    if (diff === 1) {
      checkIfUserLogsInSomeDayInRow(foundUser, receivedPromoCodes, warriorAchievement, ranks);
    }
    // Если разница больше чем в 1 день, значит дропаем стрик.
    else {
      foundUser.visitsInRow = 0;
    }

    await usersCollection.updateOne({id: userId}, {$set: foundUser});
  }
  const formattedUser = formatUserWithPromo(foundUser);
  return {
    user: formattedUser,
    receivedPromoCodes,
  };
};