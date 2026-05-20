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

  it('generateReinforcementService llama ruta correcta', async () => {
    vi.mocked(http.post).mockResolvedValue({} as any);

    await servicesService.generateReinforcementService('service-1', { price: 0 });

    expect(http.post).toHaveBeenCalledWith(
      endpoints.services.generateReinforcement('service-1'),
      { price: 0 },
    );
  });
});
