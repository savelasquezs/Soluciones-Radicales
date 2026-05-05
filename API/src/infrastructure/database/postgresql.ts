import { Pool } from 'pg';
import { env } from '../config/env';

export const db = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
});

export const checkDatabaseConnection = async (): Promise<void> => {
  await db.query('SELECT 1');
};
