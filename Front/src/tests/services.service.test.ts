import { describe, expect, it, vi, beforeEach } from 'vitest';
import { servicesService } from '@/modules/services/services/services.service';
import { endpoints } from '@/shared/api/endpoints';
import { http } from '@/shared/api/http';

vi.mock('@/shared/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('services.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getServicesByMonth llama endpoint correcto con year/month', async () => {
    vi.mocked(http.get).mockResolvedValue([] as any);

    await servicesService.getServicesByMonth({ year: 2026, month: 5 });

    expect(http.get).toHaveBeenCalledWith(endpoints.services.month, {
      params: { year: 2026, month: 5 },
    });
  });

  it('getServicesByDay llama endpoint correcto con date', async () => {
    vi.mocked(http.get).mockResolvedValue([] as any);

    await servicesService.getServicesByDay({ date: '2026-05-20T00:00:00.000Z' });

    expect(http.get).toHaveBeenCalledWith(endpoints.services.day, {
      params: { date: '2026-05-20T00:00:00.000Z' },
    });
  });

  it('createService envia payload correcto', async () => {
    vi.mocked(http.post).mockResolvedValue({} as any);

    const payload = {
      branchId: 'branch-1',
      scheduledAt: '2026-05-20T10:00:00.000Z',
      type: 'main' as const,
      price: 250000,
    };
    await servicesService.createService(payload);

    expect(http.post).toHaveBeenCalledWith(endpoints.services.create, payload);
  });

  it('assignTechniciansToService envia technicianIds', async () => {
    vi.mocked(http.post).mockResolvedValue({ success: true } as any);

    await servicesService.assignTechniciansToService('service-1', {
      technicianIds: ['tech-1', 'tech-2'],
    });

    expect(http.post).toHaveBeenCalledWith(endpoints.services.assignTechnicians('service-1'), {
      technicianIds: ['tech-1', 'tech-2'],
    });
  });

  it('generateReinforcementService llama ruta correcta', async () => {
    vi.mocked(http.post).mockResolvedValue({} as any);

    await servicesService.generateReinforcementService('service-1', { price: 0 });

    expect(http.post).toHaveBeenCalledWith(
      endpoints.services.generateReinforcement('service-1'),
      { price: 0 },
    );
  });

  it('updateServicePayment llama endpoint correcto', async () => {
    vi.mocked(http.patch).mockResolvedValue({} as any);

    await servicesService.updateServicePayment('service-1', { paymentMethodId: 'pm-1' });

    expect(http.patch).toHaveBeenCalledWith(endpoints.services.payment('service-1'), {
      paymentMethodId: 'pm-1',
    });
  });
});
