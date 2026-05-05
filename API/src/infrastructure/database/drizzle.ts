import { drizzle } from 'drizzle-orm/node-postgres';
import { db as pool } from './postgresql';

export const drizzleDb = drizzle(pool);

