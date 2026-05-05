import { NextFunction, Request, Response } from 'express';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../application/errors';

const isProduction = process.env.NODE_ENV === 'production';

export const notFoundHandler = (
  _request: Request,
  response: Response,
): void => {
  response.status(404).json({
    message: 'Route not found',
  });
};

export const errorHandler = (
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  if (error instanceof ValidationError) {
    response.status(400).json({ message: error.message });
    return;
  }

  if (error instanceof NotFoundError) {
    response.status(404).json({ message: error.message });
    return;
  }

  if (error instanceof ConflictError) {
    response.status(409).json({ message: error.message });
    return;
  }

  if (error instanceof ForbiddenError) {
    response.status(403).json({ message: error.message });
    return;
  }

  response.status(500).json({
    message: isProduction ? 'Internal server error' : error.message || 'Internal server error',
  });
};
