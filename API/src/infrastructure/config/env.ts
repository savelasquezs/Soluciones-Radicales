import { config } from 'dotenv';

config();

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

const getNumberEnv = (key: string, fallback?: string): number => {
  const value = Number(getEnv(key, fallback));

  if (Number.isNaN(value)) {
    throw new Error(`Invalid number environment variable: ${key}`);
  }

  return value;
};

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getNumberEnv('PORT', '3000'),
  database: {
    host: getEnv('DB_HOST'),
    port: getNumberEnv('DB_PORT', '5432'),
    name: getEnv('DB_NAME'),
    user: getEnv('DB_USER'),
    password: getEnv('DB_PASSWORD'),
  },
};
