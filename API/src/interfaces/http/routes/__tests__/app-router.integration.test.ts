import http from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    const { signAccessToken } = await import('../../../../infrastructure/auth/jwt.service');

    const response = await request('/api/services/upcoming', {
      headers: {
        authorization: `Bearer ${signAccessToken({
          userId: 'tech-1',
          role: 'admin',
          isTechnician: true,
        })}`,
      },
    });

    expect(response.status).toBe(200);
    expect(serviceUseCases.getUpcomingServices).toHaveBeenCalled();
  });
});
