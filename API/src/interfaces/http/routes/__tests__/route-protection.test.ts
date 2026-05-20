import express from 'express';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError } from '../../../../application/errors';
import { env } from '../../../../infrastructure/config/env';
import { signAccessToken } from '../../../../infrastructure/auth/jwt.service';
import { createAuthController } from '../../controllers/auth.controller';
import { createClientController } from '../../controllers/client.controller';
import { createServiceController } from '../../controllers/service.controller';
import { createSettingsController } from '../../controllers/settings.controller';
import { createUserController } from '../../controllers/user.controller';
import { createDashboardController } from '../../controllers/dashboard.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { errorHandler, notFoundHandler } from '../../middlewares/error.middleware';
import { requireRole } from '../../middlewares/require-role.middleware';
import { createAuthRoutes } from '../auth.routes';
import { createClientRoutes } from '../client.routes';
import { createServiceRoutes } from '../service.routes';
import { createSettingsRoutes } from '../settings.routes';
import { createUserRoutes } from '../user.routes';
import { createDashboardRoutes } from '../dashboard.routes';

const servers = new Set<http.Server>();
const serviceTechnicalUser = {
  userId: 'tech-1',
  role: 'admin' as const,
  isTechnician: true,
};

const buildServiceUseCases = () => ({
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
});

const createRequest = async (app: express.Express) => {
  app.use(notFoundHandler);
  app.use(errorHandler);

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

const createServiceRequest = async (
  useCases = buildServiceUseCases(),
) => {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/services',
    authMiddleware,
    createServiceRoutes(
      createServiceController({
        serviceUseCases: useCases,
      }),
    ),
  );

  return {
    useCases,
    request: await createRequest(app),
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

describe('route protection', () => {
  it('GET /api/users/technicians sin token retorna 401', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api/users',
      authMiddleware,
      requireRole('admin'),
      createUserRoutes(
        createUserController({
          userUseCases: {
            createUser: vi.fn(),
            listTechnicians: vi.fn(),
            getUserById: vi.fn(),
            updateUser: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/users/technicians');

    expect(response.status).toBe(401);
  });

  it('GET /api/users/technicians con usuario no admin retorna 403', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api/users',
      authMiddleware,
      requireRole('admin'),
      createUserRoutes(
        createUserController({
          userUseCases: {
            createUser: vi.fn(),
            listTechnicians: vi.fn(),
            getUserById: vi.fn(),
            updateUser: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/users/technicians', {
      headers: {
        authorization: `Bearer ${signNonAdminToken()}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it('GET /api/users/technicians con admin permite pasar al controller', async () => {
    const listTechnicians = vi.fn().mockResolvedValue([{ id: 'tech-1' }]);
    const app = express();
    app.use(express.json());
    app.use(
      '/api/users',
      authMiddleware,
      requireRole('admin'),
      createUserRoutes(
        createUserController({
          userUseCases: {
            createUser: vi.fn(),
            listTechnicians,
            getUserById: vi.fn(),
            updateUser: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/users/technicians', {
      headers: {
        authorization: `Bearer ${signAccessToken({
          userId: 'user-1',
          role: 'admin',
          isTechnician: false,
        })}`,
      },
    });

    expect(response.status).toBe(200);
    expect(listTechnicians).toHaveBeenCalled();
  });

  it('GET /api/settings sin token retorna 401', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api/settings',
      authMiddleware,
      requireRole('admin'),
      createSettingsRoutes(
        createSettingsController({
          settingsUseCases: {
            getSystemSettings: vi.fn(),
            updateSystemSettings: vi.fn(),
            createPaymentMethod: vi.fn(),
            listActivePaymentMethods: vi.fn(),
            updatePaymentMethod: vi.fn(),
            disablePaymentMethod: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/settings');

    expect(response.status).toBe(401);
  });

  it('GET /api/settings con usuario no admin retorna 403', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api/settings',
      authMiddleware,
      requireRole('admin'),
      createSettingsRoutes(
        createSettingsController({
          settingsUseCases: {
            getSystemSettings: vi.fn(),
            updateSystemSettings: vi.fn(),
            createPaymentMethod: vi.fn(),
            listActivePaymentMethods: vi.fn(),
            updatePaymentMethod: vi.fn(),
            disablePaymentMethod: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/settings', {
      headers: {
        authorization: `Bearer ${signNonAdminToken()}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it('GET /api/settings con admin permite pasar al controller', async () => {
    const getSystemSettings = vi.fn().mockResolvedValue({ id: 'settings-1' });
    const app = express();
    app.use(express.json());
    app.use(
      '/api/settings',
      authMiddleware,
      requireRole('admin'),
      createSettingsRoutes(
        createSettingsController({
          settingsUseCases: {
            getSystemSettings,
            updateSystemSettings: vi.fn(),
            createPaymentMethod: vi.fn(),
            listActivePaymentMethods: vi.fn(),
            updatePaymentMethod: vi.fn(),
            disablePaymentMethod: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/settings', {
      headers: {
        authorization: `Bearer ${signAccessToken({
          userId: 'user-1',
          role: 'admin',
          isTechnician: false,
        })}`,
      },
    });

    expect(response.status).toBe(200);
    expect(getSystemSettings).toHaveBeenCalled();
  });

  it('GET /api/dashboard/summary sin token retorna 401', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api/dashboard',
      authMiddleware,
      requireRole('admin'),
      createDashboardRoutes(
        createDashboardController({
          dashboardUseCases: {
            getSummary: vi.fn(),
            getAnalytics: vi.fn(),
            getAlerts: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);
    const response = await request('/api/dashboard/summary');
    expect(response.status).toBe(401);
  });

  it('GET /api/dashboard/summary con usuario no admin retorna 403', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api/dashboard',
      authMiddleware,
      requireRole('admin'),
      createDashboardRoutes(
        createDashboardController({
          dashboardUseCases: {
            getSummary: vi.fn(),
            getAnalytics: vi.fn(),
            getAlerts: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);
    const response = await request('/api/dashboard/summary', {
      headers: {
        authorization: `Bearer ${signNonAdminToken()}`,
      },
    });
    expect(response.status).toBe(403);
  });

  it('GET /api/clients sin token retorna 401', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api/clients',
      authMiddleware,
      requireRole('admin'),
      createClientRoutes(
        createClientController({
          clientUseCases: {
            createInitialClient: vi.fn(),
            listClients: vi.fn(),
            searchClientsByName: vi.fn(),
            searchBranches: vi.fn(),
            getClientById: vi.fn(),
            getClientDetail: vi.fn(),
            updateClient: vi.fn(),
            updateBusiness: vi.fn(),
            updateBranch: vi.fn(),
            updateBranchConfiguration: vi.fn(),
            getBranchHistory: vi.fn(),
            addBusinessToClient: vi.fn(),
            addBranchToBusiness: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/clients');

    expect(response.status).toBe(401);
  });

  it('GET /api/clients con usuario no admin retorna 403', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api/clients',
      authMiddleware,
      requireRole('admin'),
      createClientRoutes(
        createClientController({
          clientUseCases: {
            createInitialClient: vi.fn(),
            listClients: vi.fn(),
            searchClientsByName: vi.fn(),
            searchBranches: vi.fn(),
            getClientById: vi.fn(),
            getClientDetail: vi.fn(),
            updateClient: vi.fn(),
            updateBusiness: vi.fn(),
            updateBranch: vi.fn(),
            updateBranchConfiguration: vi.fn(),
            getBranchHistory: vi.fn(),
            addBusinessToClient: vi.fn(),
            addBranchToBusiness: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/clients', {
      headers: {
        authorization: `Bearer ${signNonAdminToken()}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it('GET /api/clients con admin permite pasar al controller', async () => {
    const listClients = vi.fn().mockResolvedValue([{ id: 'client-1' }]);
    const app = express();
    app.use(express.json());
    app.use(
      '/api/clients',
      authMiddleware,
      requireRole('admin'),
      createClientRoutes(
        createClientController({
          clientUseCases: {
            createInitialClient: vi.fn(),
            listClients,
            searchClientsByName: vi.fn(),
            searchBranches: vi.fn(),
            getClientById: vi.fn(),
            getClientDetail: vi.fn(),
            updateClient: vi.fn(),
            updateBusiness: vi.fn(),
            updateBranch: vi.fn(),
            updateBranchConfiguration: vi.fn(),
            getBranchHistory: vi.fn(),
            addBusinessToClient: vi.fn(),
            addBranchToBusiness: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/clients', {
      headers: {
        authorization: `Bearer ${signAccessToken({
          userId: 'user-1',
          role: 'admin',
          isTechnician: false,
        })}`,
      },
    });

    expect(response.status).toBe(200);
    expect(listClients).toHaveBeenCalled();
  });

  it.each([
    ['GET', '/api/clients/branches/search?q=abc'],
    ['GET', '/api/clients/client-1/detail'],
    ['PATCH', '/api/clients/client-1'],
    ['PATCH', '/api/clients/businesses/business-1'],
    ['PATCH', '/api/clients/branches/branch-1'],
    ['PATCH', '/api/clients/branches/branch-1/cycle'],
    ['PATCH', '/api/clients/branches/branch-1/configuration'],
    ['GET', '/api/clients/branches/branch-1/history'],
  ])('%s %s sin token retorna 401', async (method, path) => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api/clients',
      authMiddleware,
      requireRole('admin'),
      createClientRoutes(
        createClientController({
          clientUseCases: {
            createInitialClient: vi.fn(),
            listClients: vi.fn(),
            searchClientsByName: vi.fn(),
            searchBranches: vi.fn(),
            getClientById: vi.fn(),
            getClientDetail: vi.fn(),
            updateClient: vi.fn(),
            updateBusiness: vi.fn(),
            updateBranch: vi.fn(),
            updateBranchConfiguration: vi.fn(),
            getBranchHistory: vi.fn(),
            addBusinessToClient: vi.fn(),
            addBranchToBusiness: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request(path, { method });

    expect(response.status).toBe(401);
  });

  it.each([
    ['GET', '/api/clients/branches/search?q=abc'],
    ['GET', '/api/clients/client-1/detail'],
    ['PATCH', '/api/clients/client-1'],
    ['PATCH', '/api/clients/businesses/business-1'],
    ['PATCH', '/api/clients/branches/branch-1'],
    ['PATCH', '/api/clients/branches/branch-1/cycle'],
    ['PATCH', '/api/clients/branches/branch-1/configuration'],
    ['GET', '/api/clients/branches/branch-1/history'],
  ])('%s %s con usuario no admin retorna 403', async (method, path) => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api/clients',
      authMiddleware,
      requireRole('admin'),
      createClientRoutes(
        createClientController({
          clientUseCases: {
            createInitialClient: vi.fn(),
            listClients: vi.fn(),
            searchClientsByName: vi.fn(),
            searchBranches: vi.fn(),
            getClientById: vi.fn(),
            getClientDetail: vi.fn(),
            updateClient: vi.fn(),
            updateBusiness: vi.fn(),
            updateBranch: vi.fn(),
            updateBranchConfiguration: vi.fn(),
            getBranchHistory: vi.fn(),
            addBusinessToClient: vi.fn(),
            addBranchToBusiness: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request(path, {
      method,
      headers: {
        authorization: `Bearer ${signNonAdminToken()}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it('GET /api/services/upcoming sin token retorna 401', async () => {
    const { request } = await createServiceRequest();

    const response = await request('/api/services/upcoming');

    expect(response.status).toBe(401);
  });

  it('GET /api/services/upcoming con token valido permite pasar al controller', async () => {
    const { request, useCases } = await createServiceRequest();
    useCases.getUpcomingServices.mockResolvedValue({
      mainServices: [],
      reinforcements: [],
    });

    const response = await request('/api/services/upcoming', {
      headers: {
        authorization: `Bearer ${signAccessToken({
          userId: 'user-1',
          role: 'admin',
          isTechnician: false,
        })}`,
      },
    });

    expect(response.status).toBe(200);
    expect(useCases.getUpcomingServices).toHaveBeenCalled();
  });

  it.each([
    ['PATCH', '/api/services/service-1/start', undefined],
    ['PATCH', '/api/services/service-1/complete', undefined],
    ['POST', '/api/services/service-1/generate-reinforcement', {}],
    ['PATCH', '/api/services/service-1/notes', { notes: 'ok' }],
    ['PATCH', '/api/services/service-1/payment', { paymentMethodId: 'pm-1' }],
    ['POST', '/api/services/service-1/payment-proof', { fileName: 'proof.png', contentBase64: 'abc' }],
    ['POST', '/api/services/service-1/evidences', { fileName: 'evidence.png', contentBase64: 'abc' }],
    ['GET', '/api/services/service-1/evidences', undefined],
  ])('%s %s sin token retorna 401', async (method, path, body) => {
    const { request } = await createServiceRequest();

    const response = await request(path, {
      method,
      body,
    });

    expect(response.status).toBe(401);
  });

  it.each([
    ['startService', 'PATCH', '/api/services/service-1/start', undefined],
    ['completeService', 'PATCH', '/api/services/service-1/complete', undefined],
    ['addServiceNotes', 'PATCH', '/api/services/service-1/notes', { notes: 'ok' }],
    ['updateServicePayment', 'PATCH', '/api/services/service-1/payment', { paymentMethodId: 'pm-1' }],
    ['addPaymentProof', 'POST', '/api/services/service-1/payment-proof', { fileName: 'proof.png', contentBase64: 'abc' }],
    ['addServiceEvidence', 'POST', '/api/services/service-1/evidences', { fileName: 'evidence.png', contentBase64: 'abc' }],
    ['listServiceEvidences', 'GET', '/api/services/service-1/evidences', undefined],
  ] as const)('%s responde 200 en caso exitoso', async (methodName, method, path, body) => {
    const { request, useCases } = await createServiceRequest();
    useCases[methodName].mockResolvedValue(methodName === 'listServiceEvidences' ? [{ id: 'ev-1' }] : { id: 'service-1' });

    const response = await request(path, {
      method,
      body,
      headers: {
        authorization: `Bearer ${signAccessToken(serviceTechnicalUser)}`,
      },
    });

    expect(response.status).toBe(200);
  });

  it('generateReinforcementService responde 201 en caso exitoso', async () => {
    const { request, useCases } = await createServiceRequest();
    useCases.generateReinforcementService.mockResolvedValue({ id: 'service-2' });

    const response = await request('/api/services/service-1/generate-reinforcement', {
      method: 'POST',
      body: {},
      headers: {
        authorization: `Bearer ${signAccessToken(serviceTechnicalUser)}`,
      },
    });

    expect(response.status).toBe(201);
  });

  it.each([
    ['startService', 'PATCH', '/api/services/service-1/start', undefined],
    ['completeService', 'PATCH', '/api/services/service-1/complete', undefined],
    ['generateReinforcementService', 'POST', '/api/services/service-1/generate-reinforcement', {}],
    ['addServiceNotes', 'PATCH', '/api/services/service-1/notes', { notes: 'ok' }],
    ['updateServicePayment', 'PATCH', '/api/services/service-1/payment', { paymentMethodId: 'pm-1' }],
    ['addPaymentProof', 'POST', '/api/services/service-1/payment-proof', { fileName: 'proof.png', contentBase64: 'abc' }],
    ['addServiceEvidence', 'POST', '/api/services/service-1/evidences', { fileName: 'evidence.png', contentBase64: 'abc' }],
    ['listServiceEvidences', 'GET', '/api/services/service-1/evidences', undefined],
  ] as const)('%s responde 403 sin permisos', async (methodName, method, path, body) => {
    const { request, useCases } = await createServiceRequest();
    useCases[methodName].mockRejectedValue(new ForbiddenError('Forbidden'));

    const response = await request(path, {
      method,
      body,
      headers: {
        authorization: `Bearer ${signAccessToken({
          userId: 'tech-2',
          role: 'admin',
          isTechnician: true,
        })}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it.each([
    ['startService', 'PATCH', '/api/services/service-1/start', undefined],
    ['completeService', 'PATCH', '/api/services/service-1/complete', undefined],
    ['generateReinforcementService', 'POST', '/api/services/service-1/generate-reinforcement', {}],
    ['addServiceNotes', 'PATCH', '/api/services/service-1/notes', { notes: 'ok' }],
    ['updateServicePayment', 'PATCH', '/api/services/service-1/payment', { paymentMethodId: 'pm-1' }],
    ['addPaymentProof', 'POST', '/api/services/service-1/payment-proof', { fileName: 'proof.png', contentBase64: 'abc' }],
    ['addServiceEvidence', 'POST', '/api/services/service-1/evidences', { fileName: 'evidence.png', contentBase64: 'abc' }],
    ['listServiceEvidences', 'GET', '/api/services/service-1/evidences', undefined],
  ] as const)('%s responde 404 si servicio no existe', async (methodName, method, path, body) => {
    const { request, useCases } = await createServiceRequest();
    useCases[methodName].mockRejectedValue(new NotFoundError('Service not found: service-1'));

    const response = await request(path, {
      method,
      body,
      headers: {
        authorization: `Bearer ${signAccessToken(serviceTechnicalUser)}`,
      },
    });

    expect(response.status).toBe(404);
  });

  it('POST /api/auth/login sigue siendo publico', async () => {
    const login = vi.fn().mockResolvedValue({
      user: { id: 'user-1' },
      tokens: { accessToken: 'a', refreshToken: 'r' },
    });
    const app = express();
    app.use(express.json());
    app.use(
      '/api/auth',
      createAuthRoutes(
        createAuthController({
          authUseCases: {
            login,
            refreshToken: vi.fn(),
            logout: vi.fn(),
            getCurrentUser: vi.fn(),
            changePassword: vi.fn(),
            requestPasswordReset: vi.fn(),
            resetPassword: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@test.com',
        password: 'secret',
      },
    });

    expect(response.status).toBe(200);
    expect(login).toHaveBeenCalled();
  });

  it('POST /api/auth/forgot-password sigue siendo publico', async () => {
    const requestPasswordReset = vi.fn().mockResolvedValue({ success: true });
    const app = express();
    app.use(express.json());
    app.use(
      '/api/auth',
      createAuthRoutes(
        createAuthController({
          authUseCases: {
            login: vi.fn(),
            refreshToken: vi.fn(),
            logout: vi.fn(),
            getCurrentUser: vi.fn(),
            changePassword: vi.fn(),
            requestPasswordReset,
            resetPassword: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: {
        email: 'admin@test.com',
      },
    });

    expect(response.status).toBe(200);
    expect(requestPasswordReset).toHaveBeenCalled();
  });

  it('POST /api/auth/reset-password sigue siendo publico', async () => {
    const resetPassword = vi.fn().mockResolvedValue({ success: true });
    const app = express();
    app.use(express.json());
    app.use(
      '/api/auth',
      createAuthRoutes(
        createAuthController({
          authUseCases: {
            login: vi.fn(),
            refreshToken: vi.fn(),
            logout: vi.fn(),
            getCurrentUser: vi.fn(),
            changePassword: vi.fn(),
            requestPasswordReset: vi.fn(),
            resetPassword,
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: 'token',
        newPassword: 'newpassword',
      },
    });

    expect(response.status).toBe(200);
    expect(resetPassword).toHaveBeenCalled();
  });
});
