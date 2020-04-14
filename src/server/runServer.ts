import {createServer} from 'http';
import express from 'express';
import chalk from 'chalk';
import config from '../config';
import rootRouter from './routers';
import cors from 'cors';
import path from 'path';
import {MongoClient} from 'mongodb';
import Database from '../db/Database';
import withDatabase from './middlewares/withDatabase';
import withSignValidation from './middlewares/withSignValidation';

async function runServer(client: MongoClient, db: Database) {
  const {port, root} = config;
  const app = express();
  const server = createServer(app);

  app.use(cors());
  app.use(
    path.join(root, 'static').replace(/\\/g, '/'),
    express.static(path.resolve(__dirname, '../../static')),
  );
  app.use(express.json({}));
  app.use(express.urlencoded({extended: false}));
  app.use(root, withSignValidation, withDatabase(db), rootRouter);

  server.listen(port, () => {
    console.log(
      'Started listening on ' + chalk.yellow('localhost:' + port + root),
    );
  });
}

export default runServer;
