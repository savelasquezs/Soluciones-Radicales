import express from 'express';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../../../../infrastructure/config/env';
import { signAccessToken } from '../../../../infrastructure/auth/jwt.service';
import { createAuthController } from '../../controllers/auth.controller';
import { createClientController } from '../../controllers/client.controller';
import { createServiceController } from '../../controllers/service.controller';
import { createSettingsController } from '../../controllers/settings.controller';
import { createUserController } from '../../controllers/user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { errorHandler, notFoundHandler } from '../../middlewares/error.middleware';
import { requireRole } from '../../middlewares/require-role.middleware';
import { createAuthRoutes } from '../auth.routes';
import { createClientRoutes } from '../client.routes';
import { createServiceRoutes } from '../service.routes';
import { createSettingsRoutes } from '../settings.routes';
import { createUserRoutes } from '../user.routes';

const servers = new Set<http.Server>();

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
            getClientById: vi.fn(),
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
            getClientById: vi.fn(),
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
            getClientById: vi.fn(),
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

  it('GET /api/services/upcoming sin token retorna 401', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      '/api/services',
      authMiddleware,
      createServiceRoutes(
        createServiceController({
          serviceUseCases: {
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
          },
        }),
      ),
    );
    const request = await createRequest(app);

    const response = await request('/api/services/upcoming');

    expect(response.status).toBe(401);
  });

  it('GET /api/services/upcoming con token valido permite pasar al controller', async () => {
    const getUpcomingServices = vi.fn().mockResolvedValue({
      mainServices: [],
      reinforcements: [],
    });
    const app = express();
    app.use(express.json());
    app.use(
      '/api/services',
      authMiddleware,
      createServiceRoutes(
        createServiceController({
          serviceUseCases: {
            createService: vi.fn(),
            getServicesByDay: vi.fn(),
            getServicesByMonth: vi.fn(),
            getUpcomingServices,
            getTechnicianSchedule: vi.fn(),
            getServiceById: vi.fn(),
            updateServiceStatus: vi.fn(),
            rescheduleService: vi.fn(),
            cancelService: vi.fn(),
            assignTechniciansToService: vi.fn(),
          },
        }),
      ),
    );
    const request = await createRequest(app);

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
    expect(getUpcomingServices).toHaveBeenCalled();
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
    const requestPasswordReset = vi.fn().mockResolvedValue({
      message: 'If the email exists, password reset instructions were sent',
    });
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
