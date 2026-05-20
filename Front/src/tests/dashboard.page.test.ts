import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import DashboardPage from '@/modules/dashboard/pages/DashboardPage.vue';
import { dashboardService } from '@/modules/dashboard/services/dashboard.service';
import { servicesService } from '@/modules/services/services/services.service';

vi.mock('@/modules/dashboard/services/dashboard.service', () => ({
  dashboardService: {
    getDashboardSummary: vi.fn(),
    getDashboardAnalytics: vi.fn(),
    getDashboardAlerts: vi.fn(),
  },
}));

vi.mock('@/modules/services/services/services.service', () => ({
  servicesService: {
    getUpcomingServices: vi.fn(),
  },
}));

const mockSummary = {
  salesTotal: 1000000,
  servicesTotal: 10,
  servicesCompleted: 8,
  servicesPending: 1,
  servicesCanceled: 1,
  servicesRescheduled: 0,
  overdueServices: 0,
  activeClients: 4,
  activeBranches: 6,
  completionRate: 80,
};

const mockAlerts = {
  overdueServices: [],
  overdueCycles: [],
  pendingReinforcements: [],
  transfersWithoutProof: [],
  completedWithoutEvidence: [],
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue(mockSummary as any);
    vi.mocked(dashboardService.getDashboardAnalytics)
      .mockResolvedValueOnce([{ period: '2026-01', value: 1000000 }] as any)
      .mockResolvedValueOnce([{ id: 's1', key: 'completed', label: 'completed', value: 8 }] as any)
      .mockResolvedValueOnce([{ id: 'c1', key: 'c1', label: 'Cliente A', value: 700000 }] as any);
    vi.mocked(dashboardService.getDashboardAlerts).mockResolvedValue(mockAlerts as any);
    vi.mocked(servicesService.getUpcomingServices).mockResolvedValue([
      { id: 'srv-1', branchId: 'b1', scheduledAt: '2026-01-10T09:00:00.000Z', status: 'pending', type: 'main' },
    ] as any);
  });

  it('carga summary al montar', async () => {
    mount(DashboardPage);
    await flushPromises();

    expect(dashboardService.getDashboardSummary).toHaveBeenCalled();
  });

  it('llama analytics de ventas por periodo', async () => {
    mount(DashboardPage);
    await flushPromises();

    expect(dashboardService.getDashboardAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ metric: 'sales', groupBy: 'month' }),
    );
  });

  it('llama analytics de servicios por estado', async () => {
    mount(DashboardPage);
    await flushPromises();

    expect(dashboardService.getDashboardAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ metric: 'services', dimension: 'status' }),
    );
  });

  it('llama analytics de top clientes', async () => {
    mount(DashboardPage);
    await flushPromises();

    expect(dashboardService.getDashboardAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ metric: 'sales', dimension: 'client', limit: 5, sort: 'desc' }),
    );
  });

  it('carga alerts', async () => {
    mount(DashboardPage);
    await flushPromises();

    expect(dashboardService.getDashboardAlerts).toHaveBeenCalled();
  });

  it('carga próximos servicios', async () => {
    mount(DashboardPage);
    await flushPromises();

    expect(servicesService.getUpcomingServices).toHaveBeenCalledWith({ days: 7 });
  });

  it('muestra error si falla una llamada principal', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockRejectedValueOnce({ message: 'Error de carga' });
    const wrapper = mount(DashboardPage);
    await flushPromises();

    expect(wrapper.text()).toContain('Error de carga');
  });
});
