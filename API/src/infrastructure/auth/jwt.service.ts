import jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/entities';
import { env } from '../config/env';

export interface AuthJwtPayload {
  userId: string;
  role: UserRole;
  isTechnician: boolean;
}

interface RefreshTokenPayload extends AuthJwtPayload {
  type: 'refresh';
}

interface AccessTokenPayload extends AuthJwtPayload {
  type: 'access';
}

const accessTokenExpiresIn = env.auth.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'];
const refreshTokenExpiresIn = env.auth.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'];

export const signAccessToken = (payload: AuthJwtPayload): string =>
  jwt.sign(
    {
      ...payload,
      type: 'access',
    } satisfies AccessTokenPayload,
    env.auth.jwtAccessSecret,
    {
      expiresIn: accessTokenExpiresIn,
    },
  );

export const signRefreshToken = (payload: AuthJwtPayload): string =>
  jwt.sign(
    {
      ...payload,
      type: 'refresh',
    } satisfies RefreshTokenPayload,
    env.auth.jwtRefreshSecret,
    {
      expiresIn: refreshTokenExpiresIn,
    },
  );

export const verifyAccessToken = (token: string): AuthJwtPayload => {
  const decoded = jwt.verify(token, env.auth.jwtAccessSecret);
  if (typeof decoded !== 'object' || decoded.type !== 'access') {
    throw new Error('Invalid access token');
  }

  return {
    userId: String(decoded.userId),
    role: decoded.role as UserRole,
    isTechnician: Boolean(decoded.isTechnician),
  };
};

export const verifyRefreshToken = (token: string): AuthJwtPayload => {
  const decoded = jwt.verify(token, env.auth.jwtRefreshSecret);
  if (typeof decoded !== 'object' || decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }

  return {
    userId: String(decoded.userId),
    role: decoded.role as UserRole,
    isTechnician: Boolean(decoded.isTechnician),
  };
};
