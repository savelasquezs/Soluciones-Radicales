import express from 'express';
import http from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError } from '../../../../application/errors';
import { createServiceController } from '../service.controller';
import { createServiceRoutes } from '../../routes/service.routes';
import { startServer } from './http-test.helper';
import { errorHandler, notFoundHandler } from '../../middlewares/error.middleware';

const buildUseCases = () => ({
  createService: vi.fn(),
  getServicesByDay: vi.fn(),
  getServicesByMonth: vi.fn(),
  getUpcomingServices: vi.fn(),
  getTechnicianSchedule: vi.fn(),
  getServiceById: vi.fn(),
  updateServiceStatus: vi.fn(),
  rescheduleService: vi.fn(),
  cancelService: vi.fn(),
  assignTechniciansToService: vi.fn(),
  startService: vi.fn(),
  completeService: vi.fn(),
  addServiceNotes: vi.fn(),
  updateServicePayment: vi.fn(),
  addPaymentProof: vi.fn(),
  addServiceEvidence: vi.fn(),
  listServiceEvidences: vi.fn(),
});

const servers = new Set<http.Server>();

const startAuthorizedServer = async (
  controller: ReturnType<typeof createServiceController>,
  user: { userId: string; role: string; isTechnician: boolean },
) => {
  const app = express();
  app.use(express.json());
  app.use((request, _response, next) => {
    request.user = user as typeof request.user;
    next();
  });
  app.use('/api/services', createServiceRoutes(controller));
  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = http.createServer(app);
  servers.add(server);

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to resolve test server address');
  }

  return {
    request: async (
      path: string,
      init?: { method?: string; body?: unknown },
    ) => {
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
        method: init?.method ?? 'GET',
        headers: {
          'content-type': 'application/json',
        },
        body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      });

      return {
        status: response.status,
        body: (await response.json()) as Record<string, unknown>,
      };
    },
  };
};

afterEach(async () => {
  await Promise.all(
    Array.from(servers).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            servers.delete(server);
            resolve();
          });
        }),
    ),
  );
});

describe('service routes', () => {
  it('POST /api/services responde 201 cuando createService funciona', async () => {
    const useCases = buildUseCases();
    useCases.createService.mockResolvedValue({ id: 'service-1' });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startServer(createServiceRoutes(controller), '/api/services');

    const response = await server.request('/api/services', {
      method: 'POST',
      body: {
        branchId: 'branch-1',
        scheduledAt: '2026-05-05T10:00:00.000Z',
        type: 'main',
      },
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: { id: 'service-1' } });
  });

  it('GET /api/services/day?date=YYYY-MM-DD responde 200', async () => {
    const useCases = buildUseCases();
    useCases.getServicesByDay.mockResolvedValue([]);

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startServer(createServiceRoutes(controller), '/api/services');

    const response = await server.request('/api/services/day?date=2026-05-05');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
  });

  it('GET /api/services/month?year=2026&month=5 responde 200', async () => {
    const useCases = buildUseCases();
    useCases.getServicesByMonth.mockResolvedValue([]);

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startServer(createServiceRoutes(controller), '/api/services');

    const response = await server.request('/api/services/month?year=2026&month=5');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
  });

  it('GET /api/services/upcoming responde 200', async () => {
    const useCases = buildUseCases();
    useCases.getUpcomingServices.mockResolvedValue({
      mainServices: [],
      reinforcements: [],
    });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startServer(createServiceRoutes(controller), '/api/services');

    const response = await server.request('/api/services/upcoming');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { mainServices: [], reinforcements: [] } });
  });

  it('GET /api/services/technician/:technicianId/schedule responde 200', async () => {
    const useCases = buildUseCases();
    useCases.getTechnicianSchedule.mockResolvedValue({
      technician: { id: 'tech-1', name: 'Tech', email: 'tech@test.com', isTechnician: true },
      services: [],
    });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startServer(createServiceRoutes(controller), '/api/services');

    const response = await server.request('/api/services/technician/tech-1/schedule');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        technician: {
          id: 'tech-1',
          name: 'Tech',
          email: 'tech@test.com',
          isTechnician: true,
        },
        services: [],
      },
    });
  });

  it('GET /api/services/:id responde 404 si no existe', async () => {
    const useCases = buildUseCases();
    useCases.getServiceById.mockRejectedValue(new NotFoundError('Service not found: service-1'));

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startServer(createServiceRoutes(controller), '/api/services');

    const response = await server.request('/api/services/service-1');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Service not found: service-1' });
  });

  it('PATCH /api/services/:id/status responde 200', async () => {
    const useCases = buildUseCases();
    useCases.updateServiceStatus.mockResolvedValue({ id: 'service-1', status: 'completed' });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startServer(createServiceRoutes(controller), '/api/services');

    const response = await server.request('/api/services/service-1/status', {
      method: 'PATCH',
      body: { status: 'completed' },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { id: 'service-1', status: 'completed' } });
  });

  it('PATCH /api/services/:id/reschedule responde 200', async () => {
    const useCases = buildUseCases();
    useCases.rescheduleService.mockResolvedValue({ id: 'service-1', status: 'rescheduled' });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startServer(createServiceRoutes(controller), '/api/services');

    const response = await server.request('/api/services/service-1/reschedule', {
      method: 'PATCH',
      body: { scheduledAt: '2026-05-06T10:00:00.000Z' },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { id: 'service-1', status: 'rescheduled' } });
  });

  it('PATCH /api/services/:id/cancel responde 200', async () => {
    const useCases = buildUseCases();
    useCases.cancelService.mockResolvedValue({ id: 'service-1', status: 'canceled' });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startServer(createServiceRoutes(controller), '/api/services');

    const response = await server.request('/api/services/service-1/cancel', {
      method: 'PATCH',
      body: {},
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { id: 'service-1', status: 'canceled' } });
  });

  it('POST /api/services/:id/technicians responde 200', async () => {
    const useCases = buildUseCases();
    useCases.assignTechniciansToService.mockResolvedValue(undefined);

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startServer(createServiceRoutes(controller), '/api/services');

    const response = await server.request('/api/services/service-1/technicians', {
      method: 'POST',
      body: { technicianIds: ['tech-1'] },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { success: true } });
  });

  it('PATCH /api/services/:id/start responde 200', async () => {
    const useCases = buildUseCases();
    useCases.startService.mockResolvedValue({ id: 'service-1', status: 'in_progress' });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startAuthorizedServer(controller, {
      userId: 'user-1',
      role: 'admin',
      isTechnician: true,
    });

    const response = await server.request('/api/services/service-1/start', {
      method: 'PATCH',
    });

    expect(response.status).toBe(200);
  });

  it('PATCH /api/services/:id/complete responde 200', async () => {
    const useCases = buildUseCases();
    useCases.completeService.mockResolvedValue({ id: 'service-1', status: 'completed' });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startAuthorizedServer(controller, {
      userId: 'user-1',
      role: 'admin',
      isTechnician: true,
    });

    const response = await server.request('/api/services/service-1/complete', {
      method: 'PATCH',
    });

    expect(response.status).toBe(200);
  });

  it('PATCH /api/services/:id/notes responde 200', async () => {
    const useCases = buildUseCases();
    useCases.addServiceNotes.mockResolvedValue({ id: 'service-1', notes: 'ok' });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startAuthorizedServer(controller, {
      userId: 'user-1',
      role: 'admin',
      isTechnician: true,
    });

    const response = await server.request('/api/services/service-1/notes', {
      method: 'PATCH',
      body: { notes: 'ok' },
    });

    expect(response.status).toBe(200);
  });

  it('PATCH /api/services/:id/payment responde 200', async () => {
    const useCases = buildUseCases();
    useCases.updateServicePayment.mockResolvedValue({ id: 'service-1' });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startAuthorizedServer(controller, {
      userId: 'user-1',
      role: 'admin',
      isTechnician: true,
    });

    const response = await server.request('/api/services/service-1/payment', {
      method: 'PATCH',
      body: { paymentMethodId: 'pm-1' },
    });

    expect(response.status).toBe(200);
  });

  it('POST /api/services/:id/payment-proof responde 200', async () => {
    const useCases = buildUseCases();
    useCases.addPaymentProof.mockResolvedValue({ id: 'service-1' });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startAuthorizedServer(controller, {
      userId: 'user-1',
      role: 'admin',
      isTechnician: true,
    });

    const response = await server.request('/api/services/service-1/payment-proof', {
      method: 'POST',
      body: { fileName: 'proof.png', contentBase64: 'abc' },
    });

    expect(response.status).toBe(200);
  });

  it('POST /api/services/:id/evidences responde 200', async () => {
    const useCases = buildUseCases();
    useCases.addServiceEvidence.mockResolvedValue({ id: 'ev-1' });

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startAuthorizedServer(controller, {
      userId: 'user-1',
      role: 'admin',
      isTechnician: true,
    });

    const response = await server.request('/api/services/service-1/evidences', {
      method: 'POST',
      body: { fileName: 'proof.png', contentBase64: 'abc' },
    });

    expect(response.status).toBe(200);
  });

  it('GET /api/services/:id/evidences responde 200', async () => {
    const useCases = buildUseCases();
    useCases.listServiceEvidences.mockResolvedValue([{ id: 'ev-1' }]);

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startAuthorizedServer(controller, {
      userId: 'user-1',
      role: 'admin',
      isTechnician: true,
    });

    const response = await server.request('/api/services/service-1/evidences');

    expect(response.status).toBe(200);
  });

  it('responde 403 si no tiene permiso', async () => {
    const useCases = buildUseCases();
    useCases.startService.mockRejectedValue(new ForbiddenError('Forbidden'));

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startAuthorizedServer(controller, {
      userId: 'user-2',
      role: 'technician',
      isTechnician: true,
    });

    const response = await server.request('/api/services/service-1/start', {
      method: 'PATCH',
    });

    expect(response.status).toBe(403);
  });

  it('responde 404 si servicio no existe', async () => {
    const useCases = buildUseCases();
    useCases.startService.mockRejectedValue(new NotFoundError('Service not found: service-1'));

    const controller = createServiceController({ serviceUseCases: useCases });
    const server = await startAuthorizedServer(controller, {
      userId: 'user-1',
      role: 'admin',
      isTechnician: true,
    });

    const response = await server.request('/api/services/service-1/start', {
      method: 'PATCH',
    });

    expect(response.status).toBe(404);
  });
});
