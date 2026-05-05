import { RequestHandler } from 'express';

export const requireTechnician: RequestHandler = (request, response, next) => {
  if (!request.user || !request.user.isTechnician) {
    response.status(403).json({ message: 'Forbidden' });
    return;
  }

  next();
};
