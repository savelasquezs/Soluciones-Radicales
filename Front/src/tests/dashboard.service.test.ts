import { describe, expect, it, vi, beforeEach } from 'vitest';
import { dashboardService } from '@/modules/dashboard/services/dashboard.service';
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

describe('dashboard.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDashboardAnalytics pasa query params correctamente', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [], meta: { metric: 'sales' } } as any);

    await dashboardService.getDashboardAnalytics({
      metric: 'sales',
      groupBy: 'month',
      from: '2026-01-01',
      to: '2026-12-31',
      sort: 'desc',
      limit: 10,
    });

    expect(http.get).toHaveBeenCalledWith(endpoints.dashboard.analytics, {
      params: {
        metric: 'sales',
        groupBy: 'month',
        from: '2026-01-01',
        to: '2026-12-31',
        sort: 'desc',
        limit: 10,
      },
    });
  });
});
