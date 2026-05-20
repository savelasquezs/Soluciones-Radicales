import { describe, expect, it, vi, beforeEach } from 'vitest';
import { authService } from '@/modules/auth/services/auth.service';
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

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('llama endpoint login correcto', async () => {
    vi.mocked(http.post).mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user: {} as any });

    await authService.login({ email: 'admin@demo.com', password: 'Secret123' });

    expect(http.post).toHaveBeenCalledWith(endpoints.auth.login, {
      email: 'admin@demo.com',
      password: 'Secret123',
    });
  });
});
