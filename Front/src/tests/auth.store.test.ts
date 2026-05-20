import { describe, expect, it, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { authService } from '@/modules/auth/services/auth.service';

vi.mock('@/modules/auth/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

describe('auth.store', () => {
  it('login guarda tokens y usuario', async () => {
    setActivePinia(createPinia());
    const store = useAuthStore();

    (authService.login as any).mockResolvedValue({
      user: { id: 'u1', name: 'Admin', email: 'a@a.com', role: 'admin', isTechnician: true },
      accessToken: 'a1', refreshToken: 'r1',
    });

    await store.login('a@a.com', '123');

    expect(store.accessToken).toBe('a1');
    expect(store.refreshToken).toBe('r1');
    expect(store.user?.id).toBe('u1');
  });

  it('logout limpia sesiÃ³n', async () => {
    setActivePinia(createPinia());
    const store = useAuthStore();
    store.$patch({
      user: { id: 'u1', name: 'Admin', email: 'a@a.com', role: 'admin', isTechnician: false },
      accessToken: 'a1',
      refreshToken: 'r1',
    });

    (authService.logout as any).mockResolvedValue(undefined);

    await store.logout();

    expect(store.user).toBeNull();
    expect(store.accessToken).toBeNull();
    expect(store.refreshToken).toBeNull();
  });
});

