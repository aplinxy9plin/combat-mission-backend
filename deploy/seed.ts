import {
  createDb,
  createMongoClient,
  AchievementEnum,
  Collection,
} from '../src/db';
import {getUrl} from '../src/utils';
import {generateAssetUrls} from './utils';

/**
 * Запускает сиды необходимые для нормального функционирования проекта.
 */
export async function runSeeds() {
  const client = createMongoClient();
  await client.connect();
  const db = createDb(client);

  const usersCollection = await db.createCollection(Collection.Users);
  const ranksCollection = await db.createCollection(Collection.Ranks);
  const achievementsCollection = await db.createCollection(Collection.Achievements);
  const gamesCollection = await db.createCollection(Collection.Games);
  const stagesCollection = await db.createCollection(Collection.Stages);

  // РАНГИ
  // Удаляем информацию о всех рангах.
  await ranksCollection.deleteMany({});

  // Вносим новые ранги.
  await ranksCollection.insertMany([{
    name: 'Новичок',
    minPoints: 0,
    imageUrl: getUrl('ranks/0.svg'),
  }, {
    name: 'Голлум',
    minPoints: 500,
    imageUrl: getUrl('ranks/1.svg'),
  }, {
    name: 'Аватар',
    minPoints: 1400,
    imageUrl: getUrl('ranks/2.svg'),
  }, {
    name: 'Люк Скайуокер',
    minPoints: 2900,
    imageUrl: getUrl('ranks/3.svg'),
  }, {
    name: 'Чак Норрис',
    minPoints: 4900,
    imageUrl: getUrl('ranks/4.svg'),
  }, {
    name: 'Танос',
    minPoints: 7600,
    imageUrl: getUrl('ranks/5.svg'),
  }, {
    name: 'Агент 007',
    minPoints: 11100,
    imageUrl: getUrl('ranks/6.svg'),
  }, {
    name: 'Дэдпул',
    minPoints: 15500,
    imageUrl: getUrl('ranks/7.svg'),
  }, {
    name: 'Капитан Америка',
    minPoints: 21000,
    imageUrl: getUrl('ranks/8.svg'),
  }]);

  // Создаем индекс для поиска по идентификатору пользователя.
  const userIdIndexExists = await usersCollection.indexExists('id');

  if (!userIdIndexExists) {
    await usersCollection.createIndex({id: 1}, {
      name: 'id',
      unique: true,
    });
  }

  // ДОСТИЖЕНИЯ
  await achievementsCollection.deleteMany({});
  await achievementsCollection.insertMany([{
    id: AchievementEnum.TeamPlayer,
    title: 'Командный игрок',
    description: 'награда за подбор тиммейтов через приложение',
    points: [5, 25, 50, 75, 100, 125, 150, 175, 200, 225],
    rankPoints: [120, 240, 350, 410, 490, 560, 680, 790, 910, 1000],
  }, {
    id: AchievementEnum.Visitor,
    title: 'Завсегдатай',
    description: 'награда за посещение приложения',
    points: [5, 10, 20, 30, 40, 50, 60, 70, 80, 90],
    rankPoints: [80, 170, 250, 320, 390, 440, 500, 570, 690, 800],
  }, {
    id: AchievementEnum.Correspondent,
    title: 'Новостник',
    description: 'награда за подписку на главную группу Colizeum',
    rankPoints: [250],
  }, {
    id: AchievementEnum.LivingFullLife,
    title: 'Живущий полной жизнью',
    description: 'награда за использование приветственного промо-кода',
    rankPoints: [160],
  }, {
    id: AchievementEnum.Warrior,
    title: 'Стойкий боец',
    description: 'награда за посещение приложения несколько дней подряд',
    points: [3, 14, 30, 45, 60, 75, 90, 120, 140, 180],
    rankPoints: [120, 210, 320, 430, 510, 590, 650, 720, 810, 900],
  }, {
    id: AchievementEnum.RichSoul,
    title: 'Щедрая душа',
    description: 'расскажи друзьям о приложении на стене / в истории',
    rankPoints: [230],
  }, {
    id: AchievementEnum.BorderGuard,
    title: 'Чеканатор',
    description: 'награда за сканирование чеков из Colizeum',
    points: [5, 15, 30, 45, 60, 75, 90, 105, 120, 135],
    rankPoints: [120, 210, 320, 430, 510, 590, 640, 720, 810, 900],
  }].map(item => ({
    ...item,
    ...generateAssetUrls(item.id, item.points),
  })));

  // ИГРЫ
  await gamesCollection.deleteMany({});
  await gamesCollection.insertMany([
    {id: 1, title: 'Dota 2'},
    {id: 2, title: 'Counter-Strike: Global Offensive'},
    {id: 3, title: 'Mario'},
  ]);

  // СТАЖИ
  await stagesCollection.deleteMany({});
  await stagesCollection.insertMany([
    {id: 1, title: 'менее месяца'},
    {id: 2, title: '6 месяцев'},
    {id: 3, title: 'более года'},
    {id: 4, title: 'более 5 лет'},
  ]);
}
