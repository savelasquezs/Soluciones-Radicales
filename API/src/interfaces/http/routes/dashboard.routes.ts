import { Router } from 'express';
import { createDashboardController } from '../controllers/dashboard.controller';

export const createDashboardRoutes = (
  controller: ReturnType<typeof createDashboardController>,
): Router => {
  const router = Router();

  router.get('/summary', controller.getSummary);
  router.get('/analytics', controller.getAnalytics);
  router.get('/alerts', controller.getAlerts);

  return router;
};
