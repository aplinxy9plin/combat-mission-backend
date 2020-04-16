import {Config} from './http/types';

const env = process.env.ENV;
const encryptionSecret = process.env.ENCRYPTION_SECRET;
const port = Number(process.env.PORT);
const root = process.env.ROOT;
const dbHost = process.env.DB_HOST;
const dbPort = Number(process.env.DB_PORT);
const dbName = process.env.DB_NAME;
const staticBaseUrl = process.env.STATIC_BASE_URL;
const vkAppSecretKey = process.env.VK_APP_SECRET_KEY;

function getErr(envName: string) {
  return `Environment variable ${envName} not passed`;
}

if (!env) {
  throw new Error(getErr('ENV'));
}
if (!encryptionSecret) {
  throw new Error(getErr('ENCRYPTION_SECRET'));
}
if (encryptionSecret.length !== 32) {
  throw new Error('ENCRYPTION_SECRET must be length of 32');
}
if (Number.isNaN(port)) {
  throw new Error(getErr('PORT'));
}
if (!root) {
  throw new Error(getErr('ROOT'));
}
if (!dbHost) {
  throw new Error(getErr('DB_HOST'));
}
if (!dbPort) {
  throw new Error(getErr('DB_PORT'));
}
if (!dbName) {
  throw new Error(getErr('DB_NAME'));
}
if (!staticBaseUrl) {
  throw new Error(getErr('STATIC_BASE_URL'));
}
if (!vkAppSecretKey) {
  throw new Error(getErr('VK_APP_SECRET_KEY'));
}

const config: Config = {
  env,
  encryptionSecret,
  port,
  root,
  dbHost,
  dbPort,
  dbName,
  staticBaseUrl,
  vkAppSecretKey,
};

export default config;
