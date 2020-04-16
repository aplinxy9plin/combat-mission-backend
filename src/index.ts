import {runHttpServer} from './http';
import {fork, isMaster} from 'cluster';
import os from 'os';
import config from './config';

(async () => {
  // В дев-версии запускаем 1 поток.
  if (config.env === 'production' && isMaster) {
    // В продакшене запускаем максимальное кол-во, сколько позволяет процессор.
    // Создаем дополнительные кластеры.
    const cpuCount = os.cpus().length;

    for (let i = 0; i < cpuCount; i++) {
      fork();
    }
  } else {
    await runHttpServer();
  }
})();
