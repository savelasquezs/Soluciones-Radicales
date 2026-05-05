import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../../../application/errors';
import { createServiceController } from '../service.controller';
import { createServiceRoutes } from '../../routes/service.routes';
import { startServer } from './http-test.helper';

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
});
