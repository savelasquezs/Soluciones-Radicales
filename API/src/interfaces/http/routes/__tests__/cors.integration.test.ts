import http from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  getClientDetail: vi.fn(),
  updateClient: vi.fn(),
  updateBusiness: vi.fn(),
  updateBranch: vi.fn(),
  updateBranchConfiguration: vi.fn(),
  getBranchHistory: vi.fn(),
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
  startService: vi.fn(),
  completeService: vi.fn(),
  generateReinforcementService: vi.fn(),
  addServiceNotes: vi.fn(),
  updateServicePayment: vi.fn(),
  addPaymentProof: vi.fn(),
  addServiceEvidence: vi.fn(),
  listServiceEvidences: vi.fn(),
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

const dashboardUseCases = {
  getSummary: vi.fn(),
  getAnalytics: vi.fn(),
  getAlerts: vi.fn(),
};

vi.mock('../../dependencies', () => ({
  createHttpDependencies: () => ({
    authUseCases,
    clientUseCases,
    serviceUseCases,
    userUseCases,
    settingsUseCases,
    dashboardUseCases,
  }),
}));

const startApp = async (corsOrigin: string) => {
  process.env.CORS_ORIGIN = corsOrigin;
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

    return response;
  };
};

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

describe('cors integration', () => {
  it('responde preflight OPTIONS con headers CORS para origen permitido', async () => {
    const request = await startApp('http://localhost:5173');
    const response = await request('/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:5173',
    );
  });

  it('permite POST login para origen permitido', async () => {
    authUseCases.login.mockResolvedValue({
      user: { id: 'user-1' },
      tokens: { accessToken: 'a', refreshToken: 'r' },
    });
    const request = await startApp('http://localhost:5173');
    const response = await request('/api/auth/login', {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:5173',
      },
      body: {
        email: 'admin@test.com',
        password: 'secret',
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:5173',
    );
  });

  it('no retorna header CORS para origen no permitido', async () => {
    authUseCases.login.mockResolvedValue({
      user: { id: 'user-1' },
      tokens: { accessToken: 'a', refreshToken: 'r' },
    });
    const request = await startApp('http://localhost:5173');
    const response = await request('/api/auth/login', {
      method: 'POST',
      headers: {
        Origin: 'http://evil.example.com',
      },
      body: {
        email: 'admin@test.com',
        password: 'secret',
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});
