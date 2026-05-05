import { RequestHandler } from 'express';
import { verifyAccessToken } from '../../../infrastructure/auth/jwt.service';

export interface AuthenticatedRequestUser {
  userId: string;
  role: 'admin';
  isTechnician: boolean;
}

export const authMiddleware: RequestHandler = (request, response, next) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    response.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    request.user = payload;
    next();
  } catch {
    response.status(401).json({ message: 'Unauthorized' });
  }
};
