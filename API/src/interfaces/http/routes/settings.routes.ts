import { Router } from 'express';
import { createSettingsController } from '../controllers/settings.controller';

export const createSettingsRoutes = (
  controller: ReturnType<typeof createSettingsController>,
): Router => {
  const router = Router();

  router.get('/', controller.getSystemSettings);
  router.patch('/', controller.updateSystemSettings);
  router.post('/payment-methods', controller.createPaymentMethod);
  router.get('/payment-methods', controller.listActivePaymentMethods);
  router.patch('/payment-methods/:id', controller.updatePaymentMethod);
  router.patch('/payment-methods/:id/disable', controller.disablePaymentMethod);

  return router;
};
