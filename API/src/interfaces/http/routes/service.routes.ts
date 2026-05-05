import { Router } from 'express';
import { createServiceController } from '../controllers/service.controller';

export const createServiceRoutes = (
  controller: ReturnType<typeof createServiceController>,
): Router => {
  const router = Router();

  router.post('/', controller.createService);
  router.get('/day', controller.getServicesByDay);
  router.get('/month', controller.getServicesByMonth);
  router.get('/upcoming', controller.getUpcomingServices);
  router.get('/technician/:technicianId/schedule', controller.getTechnicianSchedule);
  router.get('/:id', controller.getServiceById);
  router.patch('/:id/status', controller.updateServiceStatus);
  router.patch('/:id/reschedule', controller.rescheduleService);
  router.patch('/:id/cancel', controller.cancelService);
  router.post('/:id/technicians', controller.assignTechniciansToService);

  return router;
};
