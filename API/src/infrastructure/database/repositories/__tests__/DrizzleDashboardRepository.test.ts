import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrizzleDashboardRepository } from '../DrizzleDashboardRepository';
import { drizzleDb } from '../../drizzle';

const makeRow = (overrides?: Partial<any>) => ({
  serviceId: 's1',
  scheduledAt: new Date('2026-01-10T10:00:00.000Z'),
  status: 'completed',
  type: 'main',
  price: 300000,
  paymentMethodId: 'pm1',
  paymentMethodName: 'Banco',
  paymentMethodType: 'bank',
  paymentProofUrl: null,
  branchId: 'b1',
  branchLabel: 'Sucursal 1',
  businessId: 'bs1',
  businessLabel: 'Empresa 1',
  clientId: 'c1',
  clientLabel: 'Cliente 1',
  technicianId: 't1',
  technicianLabel: 'Tecnico 1',
  technicianRevenueMode: 'split',
  ...overrides,
});

const mockSelectFrom = (rows: unknown[]) => {
  vi.spyOn(drizzleDb, 'select').mockReturnValue({
    from: vi.fn().mockResolvedValue(rows),
  } as never);
};

describe('DrizzleDashboardRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('completionRate global correcto', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([
      makeRow({ serviceId: 's1', status: 'completed' }),
      makeRow({ serviceId: 's2', status: 'pending' }),
      makeRow({ serviceId: 's3', status: 'completed' }),
    ]);
    mockSelectFrom([]);

    const result = await repo.getAnalytics({ metric: 'completionRate', sort: 'desc', limit: 20 });
    expect(result).toEqual([{ period: 'total', value: (2 / 3) * 100 }]);
  });

  it('completionRate groupBy=month usa denominador del mes', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([
      makeRow({ serviceId: 's1', scheduledAt: new Date('2026-01-01T00:00:00.000Z'), status: 'completed' }),
      makeRow({ serviceId: 's2', scheduledAt: new Date('2026-01-15T00:00:00.000Z'), status: 'completed' }),
      makeRow({ serviceId: 's3', scheduledAt: new Date('2026-01-20T00:00:00.000Z'), status: 'pending' }),
      makeRow({ serviceId: 's4', scheduledAt: new Date('2026-02-05T00:00:00.000Z'), status: 'completed' }),
      makeRow({ serviceId: 's5', scheduledAt: new Date('2026-02-08T00:00:00.000Z'), status: 'pending' }),
      makeRow({ serviceId: 's6', scheduledAt: new Date('2026-02-09T00:00:00.000Z'), status: 'pending' }),
      makeRow({ serviceId: 's7', scheduledAt: new Date('2026-02-10T00:00:00.000Z'), status: 'pending' }),
      makeRow({ serviceId: 's8', scheduledAt: new Date('2026-02-11T00:00:00.000Z'), status: 'pending' }),
    ]);
    mockSelectFrom([]);

    const result = await repo.getAnalytics({
      metric: 'completionRate',
      groupBy: 'month',
      sort: 'desc',
      limit: 20,
    });

    expect(result).toContainEqual({ period: '2026-01', value: (2 / 3) * 100 });
    expect(result).toContainEqual({ period: '2026-02', value: (1 / 5) * 100 });
  });

  it('completionRate groupBy=day usa denominador del dia', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([
      makeRow({ serviceId: 's1', scheduledAt: new Date('2026-01-01T00:00:00.000Z'), status: 'completed' }),
      makeRow({ serviceId: 's2', scheduledAt: new Date('2026-01-01T01:00:00.000Z'), status: 'pending' }),
      makeRow({ serviceId: 's3', scheduledAt: new Date('2026-01-02T00:00:00.000Z'), status: 'completed' }),
    ]);
    mockSelectFrom([]);

    const result = await repo.getAnalytics({
      metric: 'completionRate',
      groupBy: 'day',
      sort: 'desc',
      limit: 20,
    });

    expect(result).toContainEqual({ period: '2026-01-01', value: 50 });
    expect(result).toContainEqual({ period: '2026-01-02', value: 100 });
  });

  it('completionRate con dimension=technician funciona', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([
      makeRow({ serviceId: 's1', technicianId: 't1', technicianLabel: 'T1', status: 'completed' }),
      makeRow({ serviceId: 's2', technicianId: 't1', technicianLabel: 'T1', status: 'pending' }),
    ]);
    mockSelectFrom([]);

    const result = await repo.getAnalytics({
      metric: 'completionRate',
      dimension: 'technician',
      sort: 'desc',
      limit: 20,
    });
    expect(result).toEqual([{ id: 't1', key: 't1', label: 'T1', value: 50 }]);
  });

  it('completionRate con dimension=client|business|branch funciona', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([
      makeRow({ serviceId: 's1', clientId: 'c1', clientLabel: 'C1', businessId: 'bs1', businessLabel: 'B1', branchId: 'b1', branchLabel: 'BR1', status: 'completed' }),
      makeRow({ serviceId: 's2', clientId: 'c1', clientLabel: 'C1', businessId: 'bs1', businessLabel: 'B1', branchId: 'b1', branchLabel: 'BR1', status: 'pending' }),
    ]);
    mockSelectFrom([]);

    const byClient = await repo.getAnalytics({ metric: 'completionRate', dimension: 'client', sort: 'desc', limit: 20 });
    const byBusiness = await repo.getAnalytics({ metric: 'completionRate', dimension: 'business', sort: 'desc', limit: 20 });
    const byBranch = await repo.getAnalytics({ metric: 'completionRate', dimension: 'branch', sort: 'desc', limit: 20 });

    expect(byClient[0]).toMatchObject({ id: 'c1', value: 50 });
    expect(byBusiness[0]).toMatchObject({ id: 'bs1', value: 50 });
    expect(byBranch[0]).toMatchObject({ id: 'b1', value: 50 });
  });

  it('sales no duplica por multiples tecnicos', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([
      makeRow({ serviceId: 's1', technicianId: 't1', price: 300000 }),
      makeRow({ serviceId: 's1', technicianId: 't2', price: 300000 }),
    ]);
    mockSelectFrom([]);

    const result = await repo.getAnalytics({ metric: 'sales', sort: 'desc', limit: 20 });
    expect(result).toEqual([{ period: 'total', value: 300000 }]);
  });

  it('sales filtrado por tecnico no duplica servicios', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([
      makeRow({ serviceId: 's1', technicianId: 't1', price: 300000 }),
      makeRow({ serviceId: 's2', technicianId: 't1', price: 200000 }),
    ]);
    mockSelectFrom([]);

    const result = await repo.getAnalytics({
      metric: 'sales',
      technicianId: 't1',
      sort: 'desc',
      limit: 20,
    });
    expect(result).toEqual([{ period: 'total', value: 500000 }]);
  });

  it('attributedSales split divide por tecnicos y full asigna completo', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([
      makeRow({ serviceId: 's1', technicianId: 't1', technicianRevenueMode: 'split', price: 300000 }),
      makeRow({ serviceId: 's1', technicianId: 't2', technicianRevenueMode: 'split', price: 300000 }),
      makeRow({ serviceId: 's2', technicianId: 't1', technicianRevenueMode: 'full', price: 300000 }),
      makeRow({ serviceId: 's2', technicianId: 't2', technicianRevenueMode: 'full', price: 300000 }),
    ]);
    mockSelectFrom([]);

    const result = await repo.getAnalytics({
      metric: 'attributedSales',
      dimension: 'technician',
      sort: 'desc',
      limit: 20,
    });

    const t1 = result.find((item: any) => item.id === 't1') as any;
    const t2 = result.find((item: any) => item.id === 't2') as any;
    expect(t1.value).toBe(450000);
    expect(t2.value).toBe(450000);
  });

  it('attributedSales ignora servicios sin tecnicos y puede superar sales en full', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([
      makeRow({ serviceId: 's1', technicianId: null, price: 500000, technicianRevenueMode: 'full' }),
      makeRow({ serviceId: 's2', technicianId: 't1', price: 300000, technicianRevenueMode: 'full' }),
      makeRow({ serviceId: 's2', technicianId: 't2', price: 300000, technicianRevenueMode: 'full' }),
    ]);
    mockSelectFrom([]);

    const attributed = await repo.getAnalytics({
      metric: 'attributedSales',
      sort: 'desc',
      limit: 20,
    });
    const sales = await repo.getAnalytics({
      metric: 'sales',
      sort: 'desc',
      limit: 20,
    });

    expect(attributed).toEqual([{ period: 'total', value: 600000 }]);
    expect((sales[0] as any).value).toBe(800000);
  });

  it('alerts overdueServices respeta branchId|technicianId|clientId', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([
      makeRow({ serviceId: 's1', branchId: 'b1', clientId: 'c1', technicianId: 't1', scheduledAt: new Date('2020-01-01T00:00:00.000Z'), status: 'pending' }),
    ]);
    vi.spyOn(drizzleDb, 'select')
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      } as never)
      .mockReturnValueOnce({ from: vi.fn().mockResolvedValue([]) } as never);
    vi.spyOn(drizzleDb, 'execute').mockResolvedValue({ rows: [] } as never);

    const result = await repo.getAlerts({ branchId: 'b1', technicianId: 't1', clientId: 'c1' });
    expect(result.overdueServices).toHaveLength(1);
  });

  it('alerts overdueCycles respeta branchId|businessId|clientId', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([]);
    vi.spyOn(drizzleDb, 'select')
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([
                  { id: 'cy1', nextMainServiceDate: new Date('2020-01-01T00:00:00.000Z') },
                ]),
              }),
            }),
          }),
        }),
      } as never)
      .mockReturnValueOnce({ from: vi.fn().mockResolvedValue([]) } as never);
    vi.spyOn(drizzleDb, 'execute').mockResolvedValue({ rows: [] } as never);

    const result = await repo.getAlerts({ branchId: 'b1', businessId: 'bs1', clientId: 'c1' });
    expect(result.overdueCycles).toHaveLength(1);
  });

  it('alerts pendingReinforcements|transfersWithoutProof|completedWithoutEvidence respetan filtros base', async () => {
    const repo = new DrizzleDashboardRepository();
    (repo as any).fetchServiceRows = vi.fn().mockResolvedValue([
      makeRow({ serviceId: 's1', branchId: 'b1', clientId: 'c1', technicianId: 't1', status: 'completed', paymentMethodType: 'bank', paymentProofUrl: null }),
    ]);
    vi.spyOn(drizzleDb, 'select')
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      } as never)
      .mockReturnValueOnce({ from: vi.fn().mockResolvedValue([]) } as never);
    vi.spyOn(drizzleDb, 'execute').mockResolvedValue({
      rows: [{ mainServiceId: 's1', branchId: 'b1' }],
    } as never);

    const result = await repo.getAlerts({ technicianId: 't1', branchId: 'b1', clientId: 'c1' });
    expect(result.pendingReinforcements).toHaveLength(1);
    expect(result.transfersWithoutProof).toHaveLength(1);
    expect(result.completedWithoutEvidence).toHaveLength(1);
  });
});
