import { Router } from 'express';
import { createUserController } from '../controllers/user.controller';

export const createUserRoutes = (
  controller: ReturnType<typeof createUserController>,
): Router => {
  const router = Router();

  router.post('/', controller.createUser);
  router.get('/technicians', controller.listTechnicians);
  router.get('/:id', controller.getUserById);
  router.patch('/:id', controller.updateUser);

  return router;
};
