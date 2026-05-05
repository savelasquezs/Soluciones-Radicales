import { describe, expect, it, vi } from 'vitest';
import { signAccessToken } from '../../../../infrastructure/auth/jwt.service';
import { createAuthController } from '../auth.controller';
import { createAuthRoutes } from '../../routes/auth.routes';
import { startServer } from './http-test.helper';

const buildUseCases = () => ({
  login: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  changePassword: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
});

describe('auth routes', () => {
  it('POST /api/auth/login responde 200', async () => {
    const useCases = buildUseCases();
    useCases.login.mockResolvedValue({
      user: { id: 'user-1' },
      tokens: { accessToken: 'a', refreshToken: 'r' },
    });
    const server = await startServer(
      createAuthRoutes(createAuthController({ authUseCases: useCases })),
      '/api/auth',
    );

    const response = await server.request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@test.com',
        password: 'secret',
      },
    });

    expect(response.status).toBe(200);
  });

  it('POST /api/auth/refresh responde 200', async () => {
    const useCases = buildUseCases();
    useCases.refreshToken.mockResolvedValue({
      user: { id: 'user-1' },
      tokens: { accessToken: 'a2', refreshToken: 'r2' },
    });
    const server = await startServer(
      createAuthRoutes(createAuthController({ authUseCases: useCases })),
      '/api/auth',
    );

    const response = await server.request('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken: 'refresh' },
    });

    expect(response.status).toBe(200);
  });

  it('POST /api/auth/logout responde 200', async () => {
    const useCases = buildUseCases();
    useCases.logout.mockResolvedValue({ success: true });
    const server = await startServer(
      createAuthRoutes(createAuthController({ authUseCases: useCases })),
      '/api/auth',
    );

    const response = await server.request('/api/auth/logout', {
      method: 'POST',
      body: { refreshToken: 'refresh' },
    });

    expect(response.status).toBe(200);
  });

  it('GET /api/auth/me responde 401 sin token', async () => {
    const useCases = buildUseCases();
    const server = await startServer(
      createAuthRoutes(createAuthController({ authUseCases: useCases })),
      '/api/auth',
    );

    const response = await server.request('/api/auth/me');

    expect(response.status).toBe(401);
  });

  it('GET /api/auth/me responde 200 con token valido', async () => {
    const useCases = buildUseCases();
    useCases.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    const server = await startServer(
      createAuthRoutes(createAuthController({ authUseCases: useCases })),
      '/api/auth',
    );
    const token = signAccessToken({
      userId: 'user-1',
      role: 'admin',
      isTechnician: true,
    });

    const response = await server.request('/api/auth/me', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);
  });

  it('PATCH /api/auth/change-password responde 401 sin token', async () => {
    const useCases = buildUseCases();
    const server = await startServer(
      createAuthRoutes(createAuthController({ authUseCases: useCases })),
      '/api/auth',
    );

    const response = await server.request('/api/auth/change-password', {
      method: 'PATCH',
      body: {
        currentPassword: 'old',
        newPassword: 'newpassword',
      },
    });

    expect(response.status).toBe(401);
  });

  it('POST /api/auth/forgot-password responde mensaje generico', async () => {
    const useCases = buildUseCases();
    useCases.requestPasswordReset.mockResolvedValue({
      message: 'If the email exists, password reset instructions were sent',
    });
    const server = await startServer(
      createAuthRoutes(createAuthController({ authUseCases: useCases })),
      '/api/auth',
    );

    const response = await server.request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'mail@test.com' },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'If the email exists, password reset instructions were sent',
    });
  });

  it('POST /api/auth/reset-password responde 200', async () => {
    const useCases = buildUseCases();
    useCases.resetPassword.mockResolvedValue({ success: true });
    const server = await startServer(
      createAuthRoutes(createAuthController({ authUseCases: useCases })),
      '/api/auth',
    );

    const response = await server.request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: 'token',
        newPassword: 'newpassword',
      },
    });

    expect(response.status).toBe(200);
  });
});
