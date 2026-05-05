import express from 'express';
import http from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { signAccessToken } from '../../../../infrastructure/auth/jwt.service';
import { authMiddleware } from '../auth.middleware';
import { requireRole } from '../require-role.middleware';
import { requireTechnician } from '../require-technician.middleware';

const servers = new Set<http.Server>();

const startApp = async (setup: (app: express.Express) => void) => {
  const app = express();
  setup(app);

  const server = http.createServer(app);
  servers.add(server);
  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to resolve test server address');
  }

  return async (path: string, init?: RequestInit) => {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, init);
    const body = (await response.json()) as { message?: string; data?: unknown };
    return { status: response.status, body };
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

describe('auth and authorization middlewares', () => {
  it('auth.middleware responde 401 sin Authorization header', async () => {
    const request = await startApp((app) => {
      app.get('/protected', authMiddleware, (_req, res) => {
        res.status(200).json({ data: true });
      });
    });

    const response = await request('/protected');
    expect(response.status).toBe(401);
  });

  it('auth.middleware responde 401 con token invalido', async () => {
    const request = await startApp((app) => {
      app.get('/protected', authMiddleware, (_req, res) => {
        res.status(200).json({ data: true });
      });
    });

    const response = await request('/protected', {
      headers: {
        authorization: 'Bearer invalid',
      },
    });
    expect(response.status).toBe(401);
  });

  it('require-role.middleware responde 403 si no es admin', async () => {
    const request = await startApp((app) => {
      app.get('/admin', requireRole('admin'), (_req, res) => {
        res.status(200).json({ data: true });
      });
    });

    const response = await request('/admin');
    expect(response.status).toBe(403);
  });

  it('require-technician.middleware responde 403 si no es tecnico', async () => {
    const request = await startApp((app) => {
      app.get('/tech', authMiddleware, requireTechnician, (_req, res) => {
        res.status(200).json({ data: true });
      });
    });
    const token = signAccessToken({
      userId: 'user-1',
      role: 'admin',
      isTechnician: false,
    });

    const response = await request('/tech', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(response.status).toBe(403);
  });
});
