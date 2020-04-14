// Запускаем сиды.
import {runSeeds} from './seed';

(async () => {
  await runSeeds();
  process.exit();
})();
