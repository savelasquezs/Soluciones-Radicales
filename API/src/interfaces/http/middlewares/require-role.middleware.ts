import { RequestHandler } from 'express';
import { UserRole } from '../../../domain/entities';

export const requireRole = (role: UserRole): RequestHandler => {
  return (request, response, next) => {
    if (!request.user || request.user.role !== role) {
      response.status(403).json({ message: 'Forbidden' });
      return;
    }

    next();
  };
};
