import { describe, expect, it } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { authGuard } from '@/app/router/guards';

const makeTo = (path: string) => ({ fullPath: path } as any);

describe('router guards', () => {
  it('redirige a login si no autenticado', () => {
    setActivePinia(createPinia());
    let redirected = '';

    authGuard(makeTo('/dashboard'), {} as any, (value?: any) => {
      redirected = value?.path ?? '';
    });

    expect(redirected).toBe('/login');
  });
});