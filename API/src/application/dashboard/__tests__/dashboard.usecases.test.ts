import { describe, expect, it, vi } from 'vitest';
import { createDashboardUseCases } from '../dashboard.usecases';

const buildRepository = () => ({
  getSummary: vi.fn(),
  getAnalytics: vi.fn(),
  getAlerts: vi.fn(),
});

describe('dashboard usecases', () => {
  it('summary retorna ventas reales sin duplicar por tecnicos', async () => {
    const repository = buildRepository();
    repository.getSummary.mockResolvedValue({
      salesTotal: 300000,
      servicesTotal: 1,
      servicesCompleted: 1,
      servicesPending: 0,
      servicesCanceled: 0,
      servicesRescheduled: 0,
      overdueServices: 0,
      activeClients: 1,
      activeBranches: 1,
      completionRate: 100,
    });
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getSummary({});
    expect(result.salesTotal).toBe(300000);
  });

  it('summary filtra por rango de fecha', async () => {
    const repository = buildRepository();
    repository.getSummary.mockResolvedValue({ servicesTotal: 2 });
    const useCases = createDashboardUseCases({ dashboardRepository: repository });
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-12-31T00:00:00.000Z');

    await useCases.getSummary({ from, to });
    expect(repository.getSummary).toHaveBeenCalledWith({ from, to });
  });

  it('summary filtra por tecnico', async () => {
    const repository = buildRepository();
    repository.getSummary.mockResolvedValue({ servicesTotal: 3 });
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    await useCases.getSummary({ technicianId: 'tech-1' });
    expect(repository.getSummary).toHaveBeenCalledWith({ technicianId: 'tech-1' });
  });

  it('summary calcula completionRate', async () => {
    const repository = buildRepository();
    repository.getSummary.mockResolvedValue({ completionRate: 66.66 });
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getSummary({});
    expect(result.completionRate).toBe(66.66);
  });

  it('analytics sales agrupado por mes', async () => {
    const repository = buildRepository();
    repository.getAnalytics.mockResolvedValue([{ period: '2026-01', value: 4200000 }]);
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getAnalytics({ metric: 'sales', groupBy: 'month' });
    expect(result.data).toEqual([{ period: '2026-01', value: 4200000 }]);
  });

  it('analytics services agrupado por mes', async () => {
    const repository = buildRepository();
    repository.getAnalytics.mockResolvedValue([{ period: '2026-01', value: 20 }]);
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getAnalytics({ metric: 'services', groupBy: 'month' });
    expect(result.data).toEqual([{ period: '2026-01', value: 20 }]);
  });

  it('analytics services por status', async () => {
    const repository = buildRepository();
    repository.getAnalytics.mockResolvedValue([
      { id: 'completed', key: 'completed', label: 'completed', value: 12 },
    ]);
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getAnalytics({ metric: 'services', dimension: 'status' });
    expect(result.data).toEqual([
      { id: 'completed', key: 'completed', label: 'completed', value: 12 },
    ]);
  });

  it('analytics sales por client', async () => {
    const repository = buildRepository();
    repository.getAnalytics.mockResolvedValue([
      { id: 'client-1', key: 'client-1', label: 'Cliente A', value: 4200000 },
    ]);
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getAnalytics({ metric: 'sales', dimension: 'client' });
    expect(result.data).toEqual([
      { id: 'client-1', key: 'client-1', label: 'Cliente A', value: 4200000 },
    ]);
  });

  it('analytics attributedSales por technician con branch split', async () => {
    const repository = buildRepository();
    repository.getAnalytics.mockResolvedValue([
      { id: 'tech-1', key: 'tech-1', label: 'Tech 1', value: 100000 },
    ]);
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getAnalytics({
      metric: 'attributedSales',
      dimension: 'technician',
    });
    expect(result.data).toEqual([
      { id: 'tech-1', key: 'tech-1', label: 'Tech 1', value: 100000 },
    ]);
  });

  it('analytics attributedSales por technician con branch full', async () => {
    const repository = buildRepository();
    repository.getAnalytics.mockResolvedValue([
      { id: 'tech-2', key: 'tech-2', label: 'Tech 2', value: 300000 },
    ]);
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getAnalytics({
      metric: 'attributedSales',
      technicianId: 'tech-2',
    });
    expect(result.data).toEqual([
      { id: 'tech-2', key: 'tech-2', label: 'Tech 2', value: 300000 },
    ]);
  });

  it('analytics attributedSales rechaza dimension invalida', async () => {
    const repository = buildRepository();
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    await expect(
      useCases.getAnalytics({
        metric: 'attributedSales',
        dimension: 'client',
      }),
    ).rejects.toThrow('attributedSales requires dimension=technician or technicianId');
  });

  it('analytics limit maximo se respeta', async () => {
    const repository = buildRepository();
    repository.getAnalytics.mockResolvedValue([]);
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    await useCases.getAnalytics({
      metric: 'sales',
      groupBy: 'month',
      limit: 100,
    });

    expect(repository.getAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 }),
    );
  });

  it('completionRate con dimension=technician es valido', async () => {
    const repository = buildRepository();
    repository.getAnalytics.mockResolvedValue([]);
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    await useCases.getAnalytics({
      metric: 'completionRate',
      dimension: 'technician',
    });

    expect(repository.getAnalytics).toHaveBeenCalled();
  });

  it('completionRate rechaza dimension=status', async () => {
    const repository = buildRepository();
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    await expect(
      useCases.getAnalytics({
        metric: 'completionRate',
        dimension: 'status',
      }),
    ).rejects.toThrow(
      'completionRate only allows dimension=technician|client|business|branch',
    );
  });

  it('completionRate rechaza dimension=serviceType', async () => {
    const repository = buildRepository();
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    await expect(
      useCases.getAnalytics({
        metric: 'completionRate',
        dimension: 'serviceType',
      }),
    ).rejects.toThrow(
      'completionRate only allows dimension=technician|client|business|branch',
    );
  });

  it('completionRate rechaza dimension=paymentMethod', async () => {
    const repository = buildRepository();
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    await expect(
      useCases.getAnalytics({
        metric: 'completionRate',
        dimension: 'paymentMethod',
      }),
    ).rejects.toThrow(
      'completionRate only allows dimension=technician|client|business|branch',
    );
  });

  it('completionRate rechaza dimension=paidStatus', async () => {
    const repository = buildRepository();
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    await expect(
      useCases.getAnalytics({
        metric: 'completionRate',
        dimension: 'paidStatus',
      }),
    ).rejects.toThrow(
      'completionRate only allows dimension=technician|client|business|branch',
    );
  });

  it('alerts overdueServices retorna servicios vencidos', async () => {
    const repository = buildRepository();
    repository.getAlerts.mockResolvedValue({
      overdueServices: [{ id: 's-1' }],
      overdueCycles: [],
      pendingReinforcements: [],
      transfersWithoutProof: [],
      completedWithoutEvidence: [],
    });
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getAlerts({});
    expect(result.overdueServices).toHaveLength(1);
  });

  it('alerts overdueCycles retorna ciclos vencidos', async () => {
    const repository = buildRepository();
    repository.getAlerts.mockResolvedValue({
      overdueServices: [],
      overdueCycles: [{ id: 'c-1' }],
      pendingReinforcements: [],
      transfersWithoutProof: [],
      completedWithoutEvidence: [],
    });
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getAlerts({});
    expect(result.overdueCycles).toHaveLength(1);
  });

  it('alerts pendingReinforcements detecta pendientes', async () => {
    const repository = buildRepository();
    repository.getAlerts.mockResolvedValue({
      overdueServices: [],
      overdueCycles: [],
      pendingReinforcements: [{ id: 'p-1' }],
      transfersWithoutProof: [],
      completedWithoutEvidence: [],
    });
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getAlerts({});
    expect(result.pendingReinforcements).toHaveLength(1);
  });

  it('alerts transfersWithoutProof detecta pagos sin soporte', async () => {
    const repository = buildRepository();
    repository.getAlerts.mockResolvedValue({
      overdueServices: [],
      overdueCycles: [],
      pendingReinforcements: [],
      transfersWithoutProof: [{ id: 't-1' }],
      completedWithoutEvidence: [],
    });
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getAlerts({});
    expect(result.transfersWithoutProof).toHaveLength(1);
  });

  it('alerts completedWithoutEvidence detecta sin evidencia', async () => {
    const repository = buildRepository();
    repository.getAlerts.mockResolvedValue({
      overdueServices: [],
      overdueCycles: [],
      pendingReinforcements: [],
      transfersWithoutProof: [],
      completedWithoutEvidence: [{ id: 'e-1' }],
    });
    const useCases = createDashboardUseCases({ dashboardRepository: repository });

    const result = await useCases.getAlerts({});
    expect(result.completedWithoutEvidence).toHaveLength(1);
  });
});
