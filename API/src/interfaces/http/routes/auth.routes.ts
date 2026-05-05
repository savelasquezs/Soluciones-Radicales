import { Router } from 'express';
import { createAuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const createAuthRoutes = (
  controller: ReturnType<typeof createAuthController>,
): Router => {
  const router = Router();

  router.post('/login', controller.login);
  router.post('/refresh', controller.refreshToken);
  router.post('/logout', controller.logout);
  router.get('/me', authMiddleware, controller.getCurrentUser);
  router.patch('/change-password', authMiddleware, controller.changePassword);
  router.post('/forgot-password', controller.forgotPassword);
  router.post('/reset-password', controller.resetPassword);

  return router;
};
