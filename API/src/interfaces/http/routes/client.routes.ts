import { Router } from 'express';
import { createClientController } from '../controllers/client.controller';

export const createClientRoutes = (
  controller: ReturnType<typeof createClientController>,
): Router => {
  const router = Router();

  router.post('/', controller.createInitialClient);
  router.get('/', controller.listClients);
  router.get('/search', controller.searchClientsByName);
  router.get('/branches/search', controller.searchBranches);
  router.get('/branches/:branchId/history', controller.getBranchHistory);
  router.patch('/branches/:branchId/cycle', controller.updateBranchServiceCycle);
  router.patch('/branches/:branchId/configuration', controller.updateBranchConfiguration);
  router.patch('/branches/:branchId', controller.updateBranch);
  router.patch('/businesses/:businessId', controller.updateBusiness);
  router.get('/:id/detail', controller.getClientDetail);
  router.get('/:id', controller.getClientById);
  router.patch('/:id', controller.updateClient);
  router.post('/:clientId/businesses', controller.addBusinessToClient);
  router.post('/businesses/:businessId/branches', controller.addBranchToBusiness);

  return router;
};
