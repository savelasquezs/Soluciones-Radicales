import { describe, expect, it, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { resolveRouteAccess } from '@/app/router/guards';

const makeTo = (path: string) => ({ path, fullPath: path } as any);

describe('router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('usuario no autenticado intentando /dashboard -> /login', async () => {
    const result = await resolveRouteAccess(makeTo('/dashboard'));
    expect(result).toEqual({ path: '/login', query: { redirect: '/dashboard' } });
  });

  it('usuario admin entrando /login -> /dashboard', async () => {
    const auth = useAuthStore();
    auth.user = { id: '1', name: 'Admin', email: 'a@a.com', role: 'admin', isTechnician: false };
    auth.accessToken = 'a';
    const result = await resolveRouteAccess(makeTo('/login'));
    expect(result).toEqual({ path: '/dashboard' });
  });

  it('tecnico entrando /login -> /technician/schedule', async () => {
    const auth = useAuthStore();
    auth.user = { id: '1', name: 'Tec', email: 't@t.com', role: 'technician', isTechnician: true };
    auth.accessToken = 'a';
    const result = await resolveRouteAccess(makeTo('/login'));
    expect(result).toEqual({ path: '/technician/schedule' });
  });

  it('tecnico intentando /dashboard -> /technician/schedule', async () => {
    const auth = useAuthStore();
    auth.user = { id: '1', name: 'Tec', email: 't@t.com', role: 'technician', isTechnician: true };
    auth.accessToken = 'a';
    const result = await resolveRouteAccess(makeTo('/dashboard'));
    expect(result).toEqual({ path: '/technician/schedule' });
  });

  it('admin intentando /technician/schedule sin ser tecnico -> /dashboard', async () => {
    const auth = useAuthStore();
    auth.user = { id: '1', name: 'Admin', email: 'a@a.com', role: 'admin', isTechnician: false };
    auth.accessToken = 'a';
    const result = await resolveRouteAccess(makeTo('/technician/schedule'));
    expect(result).toEqual({ path: '/dashboard' });
  });

  it('admin+tecnico puede entrar a ambas rutas', async () => {
    const auth = useAuthStore();
    auth.user = { id: '1', name: 'Both', email: 'b@b.com', role: 'admin', isTechnician: true };
    auth.accessToken = 'a';

    const adminResult = await resolveRouteAccess(makeTo('/dashboard'));
    const techResult = await resolveRouteAccess(makeTo('/technician/schedule'));

    expect(adminResult).toBe(true);
    expect(techResult).toBe(true);
  });
});
