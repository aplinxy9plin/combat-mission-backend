/**
 * Server config
 */
export interface Config {
  env: string;
  encryptionSecret: string;
  port: number;
  root: string;
  dbName: string;
  dbHost: string;
  dbPort: number;
  vkAppSecretKey: string;
  staticBaseUrl: string;
}

