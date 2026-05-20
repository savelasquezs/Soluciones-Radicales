import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../../../application/errors';
import { createUserController } from '../user.controller';
import { createUserRoutes } from '../../routes/user.routes';
import { startServer } from './http-test.helper';

const buildUseCases = () => ({
  createUser: vi.fn(),
  listUsers: vi.fn(),
  listTechnicians: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  disableUser: vi.fn(),
});

describe('user routes', () => {
  it('POST /api/users responde 201 cuando createUser funciona', async () => {
    const useCases = buildUseCases();
    useCases.createUser.mockResolvedValue({ id: 'user-1', name: 'Admin' });

    const controller = createUserController({ userUseCases: useCases });
    const server = await startServer(createUserRoutes(controller), '/api/users');

    const response = await server.request('/api/users', {
      method: 'POST',
      body: {
        name: 'Admin',
        email: 'admin@test.com',
        password: 'secret',
      },
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: { id: 'user-1', name: 'Admin' } });
  });

  it('GET /api/users/technicians responde 200', async () => {
    const useCases = buildUseCases();
    useCases.listTechnicians.mockResolvedValue([{ id: 'tech-1' }]);

    const controller = createUserController({ userUseCases: useCases });
    const server = await startServer(createUserRoutes(controller), '/api/users');

    const response = await server.request('/api/users/technicians');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [{ id: 'tech-1' }] });
  });

  it('GET /api/users responde 200', async () => {
    const useCases = buildUseCases();
    useCases.listUsers.mockResolvedValue([{ id: 'user-1' }]);

    const controller = createUserController({ userUseCases: useCases });
    const server = await startServer(createUserRoutes(controller), '/api/users');

    const response = await server.request('/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [{ id: 'user-1' }] });
  });

  it('GET /api/users/:id responde 404 si no existe', async () => {
    const useCases = buildUseCases();
    useCases.getUserById.mockRejectedValue(new NotFoundError('User not found: user-1'));

    const controller = createUserController({ userUseCases: useCases });
    const server = await startServer(createUserRoutes(controller), '/api/users');

    const response = await server.request('/api/users/user-1');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User not found: user-1' });
  });

  it('PATCH /api/users/:id responde 200', async () => {
    const useCases = buildUseCases();
    useCases.updateUser.mockResolvedValue({ id: 'user-1', isTechnician: true });

    const controller = createUserController({ userUseCases: useCases });
    const server = await startServer(createUserRoutes(controller), '/api/users');

    const response = await server.request('/api/users/user-1', {
      method: 'PATCH',
      body: { isTechnician: true },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { id: 'user-1', isTechnician: true } });
  });

  it('PATCH /api/users/:id/disable responde 200', async () => {
    const useCases = buildUseCases();
    useCases.disableUser.mockResolvedValue({ success: true });

    const controller = createUserController({ userUseCases: useCases });
    const server = await startServer(createUserRoutes(controller), '/api/users');

    const response = await server.request('/api/users/user-1/disable', {
      method: 'PATCH',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { success: true } });
  });
});
