import { describe, expect, it, vi } from 'vitest';
import { createDashboardController } from '../dashboard.controller';
import { createDashboardRoutes } from '../../routes/dashboard.routes';
import { startServer } from './http-test.helper';

const buildUseCases = () => ({
  getSummary: vi.fn(),
  getAnalytics: vi.fn(),
  getAlerts: vi.fn(),
});

describe('dashboard routes', () => {
  it('GET /api/dashboard/summary responde 200', async () => {
    const useCases = buildUseCases();
    useCases.getSummary.mockResolvedValue({ salesTotal: 0 });
    const server = await startServer(
      createDashboardRoutes(createDashboardController({ dashboardUseCases: useCases })),
      '/api/dashboard',
    );

    const response = await server.request('/api/dashboard/summary');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { salesTotal: 0 } });
  });

  it('GET /api/dashboard/analytics exige metric', async () => {
    const useCases = buildUseCases();
    const server = await startServer(
      createDashboardRoutes(createDashboardController({ dashboardUseCases: useCases })),
      '/api/dashboard',
    );

    const response = await server.request('/api/dashboard/analytics');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Metric query is required' });
  });

  it('GET /api/dashboard/alerts responde 200', async () => {
    const useCases = buildUseCases();
    useCases.getAlerts.mockResolvedValue({
      overdueServices: [],
      overdueCycles: [],
      pendingReinforcements: [],
      transfersWithoutProof: [],
      completedWithoutEvidence: [],
    });
    const server = await startServer(
      createDashboardRoutes(createDashboardController({ dashboardUseCases: useCases })),
      '/api/dashboard',
    );

    const response = await server.request('/api/dashboard/alerts');

    expect(response.status).toBe(200);
  });
});
