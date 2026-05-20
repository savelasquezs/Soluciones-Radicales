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
  auth: {
    jwtAccessSecret: getEnv('JWT_ACCESS_SECRET', 'dev-access-secret'),
    jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    jwtAccessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
    jwtRefreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
    passwordResetExpiresMinutes: getNumberEnv('PASSWORD_RESET_EXPIRES_MINUTES', '30'),
    frontendResetPasswordUrl: getEnv(
      'FRONTEND_RESET_PASSWORD_URL',
      'http://localhost:5173/reset-password',
    ),
  },
  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
};
