import { Request, Response, NextFunction } from 'express';
import { checkDatabaseConnection } from '../../../infrastructure/database/postgresql';

export const healthController = async (
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await checkDatabaseConnection();

    response.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
