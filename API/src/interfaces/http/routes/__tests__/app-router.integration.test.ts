import http from 'node:http';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '../../../../infrastructure/config/env';

const servers = new Set<http.Server>();

const authUseCases = {
  login: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  changePassword: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
};

const clientUseCases = {
  createInitialClient: vi.fn(),
  listClients: vi.fn(),
  searchClientsByName: vi.fn(),
  getClientById: vi.fn(),
  addBusinessToClient: vi.fn(),
  addBranchToBusiness: vi.fn(),
};

const serviceUseCases = {
  createService: vi.fn(),
  getServicesByDay: vi.fn(),
  getServicesByMonth: vi.fn(),
  getUpcomingServices: vi.fn(),
  getTechnicianSchedule: vi.fn(),
  getServiceById: vi.fn(),
  updateServiceStatus: vi.fn(),
  rescheduleService: vi.fn(),
  cancelService: vi.fn(),
  assignTechniciansToService: vi.fn(),
};

const userUseCases = {
  createUser: vi.fn(),
  listTechnicians: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
};

const settingsUseCases = {
  getSystemSettings: vi.fn(),
  updateSystemSettings: vi.fn(),
  createPaymentMethod: vi.fn(),
  listActivePaymentMethods: vi.fn(),
  updatePaymentMethod: vi.fn(),
  disablePaymentMethod: vi.fn(),
};

const signAdminToken = async () => {
  const { signAccessToken } = await import('../../../../infrastructure/auth/jwt.service');
  return signAccessToken({
    userId: 'user-1',
    role: 'admin',
    isTechnician: true,
  });
};

const signNonAdminToken = () =>
  jwt.sign(
    {
      userId: 'user-2',
      role: 'operator',
      isTechnician: false,
      type: 'access',
    },
    env.auth.jwtAccessSecret,
    {
      expiresIn: env.auth.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'],
    },
  );

vi.mock('../../dependencies', () => ({
  createHttpDependencies: () => ({
    authUseCases,
    clientUseCases,
    serviceUseCases,
    userUseCases,
    settingsUseCases,
  }),
}));

const startApp = async () => {
  vi.resetModules();
  const { createApp } = await import('../../../../app');
  const app = createApp();
  const server = http.createServer(app);
  servers.add(server);

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to resolve test server address');
  }

  return async (
    path: string,
    init?: {
      method?: string;
      body?: unknown;
      headers?: Record<string, string>;
    },
  ) => {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });

    return {
      status: response.status,
      body: (await response.json()) as Record<string, unknown>,
    };
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(async () => {
  await Promise.all(
    Array.from(servers).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            servers.delete(server);
            resolve();
          });
        }),
    ),
  );
});

describe('app router integration', () => {
  it('mantiene auth publico en /api/auth/login', async () => {
    authUseCases.login.mockResolvedValue({
      user: { id: 'user-1' },
      tokens: { accessToken: 'a', refreshToken: 'r' },
    });
    const request = await startApp();

    const response = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@test.com',
        password: 'secret',
      },
    });

    expect(response.status).toBe(200);
    expect(authUseCases.login).toHaveBeenCalled();
  });

  it('bloquea /api/clients sin token', async () => {
    const request = await startApp();

    const response = await request('/api/clients');

    expect(response.status).toBe(401);
    expect(clientUseCases.listClients).not.toHaveBeenCalled();
  });

  it('permite /api/services/upcoming con token valido sin exigir admin', async () => {
    serviceUseCases.getUpcomingServices.mockResolvedValue({
      mainServices: [],
      reinforcements: [],
    });
    const request = await startApp();

    const response = await request('/api/services/upcoming', {
      headers: {
        authorization: `Bearer ${await signAdminToken()}`,
      },
    });

    expect(response.status).toBe(200);
    expect(serviceUseCases.getUpcomingServices).toHaveBeenCalled();
  });

  it('retorna 403 en /api/users/technicians con usuario no admin', async () => {
    const request = await startApp();

    const response = await request('/api/users/technicians', {
      headers: {
        authorization: `Bearer ${signNonAdminToken()}`,
      },
    });

    expect(response.status).toBe(403);
    expect(userUseCases.listTechnicians).not.toHaveBeenCalled();
  });

  it('permite /api/users/technicians con admin', async () => {
    userUseCases.listTechnicians.mockResolvedValue([{ id: 'tech-1' }]);
    const request = await startApp();

    const response = await request('/api/users/technicians', {
      headers: {
        authorization: `Bearer ${await signAdminToken()}`,
      },
    });

    expect(response.status).toBe(200);
    expect(userUseCases.listTechnicians).toHaveBeenCalled();
  });

  it('retorna 403 en /api/settings con usuario no admin', async () => {
    const request = await startApp();

    const response = await request('/api/settings', {
      headers: {
        authorization: `Bearer ${signNonAdminToken()}`,
      },
    });

    expect(response.status).toBe(403);
    expect(settingsUseCases.getSystemSettings).not.toHaveBeenCalled();
  });

  it('permite /api/settings con admin', async () => {
    settingsUseCases.getSystemSettings.mockResolvedValue({ id: 'settings-1' });
    const request = await startApp();

    const response = await request('/api/settings', {
      headers: {
        authorization: `Bearer ${await signAdminToken()}`,
      },
    });

    expect(response.status).toBe(200);
    expect(settingsUseCases.getSystemSettings).toHaveBeenCalled();
  });

  it('retorna 403 en /api/clients con usuario no admin', async () => {
    const request = await startApp();

    const response = await request('/api/clients', {
      headers: {
        authorization: `Bearer ${signNonAdminToken()}`,
      },
    });

    expect(response.status).toBe(403);
    expect(clientUseCases.listClients).not.toHaveBeenCalled();
  });

  it('permite /api/clients con admin', async () => {
    clientUseCases.listClients.mockResolvedValue([{ id: 'client-1' }]);
    const request = await startApp();

    const response = await request('/api/clients', {
      headers: {
        authorization: `Bearer ${await signAdminToken()}`,
      },
    });

    expect(response.status).toBe(200);
    expect(clientUseCases.listClients).toHaveBeenCalled();
  });
});
