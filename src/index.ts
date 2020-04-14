import runServer from './server/runServer';
import {fork, isMaster} from 'cluster';
import os from 'os';
import {createDb, createMongoClient} from './db';
import config from './config';

(async () => {
  const client = createMongoClient();
  await client.connect();
  const db = createDb(client);

  // В дев-версии запускаем 1 поток.
  if (config.env === 'production' && isMaster) {
    // В продакшене запускаем максимальное кол-во, сколько позволяет процессор.
    // Создаем дополнительные кластеры.
    const cpuCount = os.cpus().length;

    for (let i = 0; i < cpuCount; i++) {
      fork();
    }
  } else {
    await runServer(client, db);
  }
})();
