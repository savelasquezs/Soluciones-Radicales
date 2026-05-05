import express from 'express';
import { router } from './interfaces/http/routes';
import {
  errorHandler,
  notFoundHandler,
} from './interfaces/http/middlewares/error-handler';

export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
