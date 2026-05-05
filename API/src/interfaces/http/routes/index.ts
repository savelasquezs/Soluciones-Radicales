import { Router } from 'express';
import { createHttpDependencies } from '../dependencies';
import { createClientController } from '../controllers/client.controller';
import { createServiceController } from '../controllers/service.controller';
import { createSettingsController } from '../controllers/settings.controller';
import { createUserController } from '../controllers/user.controller';
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

  router.use(healthRoutes);
  router.use('/clients', createClientRoutes(clientController));
  router.use('/services', createServiceRoutes(serviceController));
  router.use('/users', createUserRoutes(userController));
  router.use('/settings', createSettingsRoutes(settingsController));

  return router;
};

const router = createApiRouter();

export { router };
