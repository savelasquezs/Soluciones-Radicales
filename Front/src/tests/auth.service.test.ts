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
    vi.mocked(http.post).mockResolvedValue({ user: {} as any, tokens: { accessToken: 'a', refreshToken: 'r' } });

    const res = await authService.login({ email: 'admin@demo.com', password: 'Secret123' });

    expect(http.post).toHaveBeenCalledWith(endpoints.auth.login, {
      email: 'admin@demo.com',
      password: 'Secret123',
    });

    expect(res).toEqual({ user: {}, accessToken: 'a', refreshToken: 'r' });
  });

  it('lanza error si tokens faltan', async () => {
    vi.mocked(http.post).mockResolvedValue({ user: {} as any } as any);

    await expect(
      authService.login({ email: 'x', password: 'y' }),
    ).rejects.toThrow('Invalid login response');
  });
});
