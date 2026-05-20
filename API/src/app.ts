import express from 'express';
import cors from 'cors';
import { env } from './infrastructure/config/env';
import { router } from './interfaces/http/routes';
import {
  errorHandler,
  notFoundHandler,
} from './interfaces/http/middlewares/error.middleware';

export const createApp = () => {
  const app = express();
  const corsOptions: cors.CorsOptions = {
    origin: env.cors.origin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));
  app.use(express.json());
  app.use('/api', router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
