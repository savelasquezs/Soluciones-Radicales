import { describe, expect, it, vi, beforeEach } from 'vitest';
import { clientsService } from '@/modules/clients/services/clients.service';
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

describe('clients.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getClientDetail llama ruta correcta', async () => {
    vi.mocked(http.get).mockResolvedValue({ client: {} as any, businesses: [] });

    await clientsService.getClientDetail('client-1');

    expect(http.get).toHaveBeenCalledWith(endpoints.clients.detail('client-1'));
  });
});
