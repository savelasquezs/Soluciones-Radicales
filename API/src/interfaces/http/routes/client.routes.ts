import { Router } from 'express';
import { createClientController } from '../controllers/client.controller';

export const createClientRoutes = (
  controller: ReturnType<typeof createClientController>,
): Router => {
  const router = Router();

  router.post('/', controller.createInitialClient);
  router.get('/', controller.listClients);
  router.get('/search', controller.searchClientsByName);
  router.get('/:id', controller.getClientById);
  router.post('/:clientId/businesses', controller.addBusinessToClient);
  router.post('/businesses/:businessId/branches', controller.addBranchToBusiness);

  return router;
};
