import { Router } from 'express';
import { createHttpDependencies } from '../dependencies';
import { createAuthController } from '../controllers/auth.controller';
import { createClientController } from '../controllers/client.controller';
import { createServiceController } from '../controllers/service.controller';
import { createSettingsController } from '../controllers/settings.controller';
import { createUserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/require-role.middleware';
import { createAuthRoutes } from './auth.routes';
import { createClientRoutes } from './client.routes';
import { createServiceRoutes } from './service.routes';
import { createSettingsRoutes } from './settings.routes';
import { createUserRoutes } from './user.routes';
import { healthRoutes } from './health-routes';

export const createApiRouter = () => {
  const router = Router();
  const dependencies = createHttpDependencies();
  const clientController = createClientController({
    clientUseCases: dependencies.clientUseCases,
  });
  const serviceController = createServiceController({
    serviceUseCases: dependencies.serviceUseCases,
  });
  const userController = createUserController({
    userUseCases: dependencies.userUseCases,
  });
  const settingsController = createSettingsController({
    settingsUseCases: dependencies.settingsUseCases,
  });
  const authController = createAuthController({
    authUseCases: dependencies.authUseCases,
  });

  router.use(healthRoutes);
  router.use('/auth', createAuthRoutes(authController));
  router.use('/clients', authMiddleware, requireRole('admin'), createClientRoutes(clientController));
  router.use('/services', authMiddleware, createServiceRoutes(serviceController));
  router.use('/users', authMiddleware, requireRole('admin'), createUserRoutes(userController));
  router.use(
    '/settings',
    authMiddleware,
    requireRole('admin'),
    createSettingsRoutes(settingsController),
  );

  return router;
};

const router = createApiRouter();

export { router };
