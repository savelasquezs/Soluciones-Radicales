import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: 'admin';
        isTechnician: boolean;
      };
    }
  }
}

export {};
