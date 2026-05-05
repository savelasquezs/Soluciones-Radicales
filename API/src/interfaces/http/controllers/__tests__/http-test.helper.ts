import http from 'node:http';
import express, { Router } from 'express';
import { afterEach } from 'vitest';
import {
  errorHandler,
  notFoundHandler,
} from '../../middlewares/error.middleware';

interface TestResponse<T = unknown> {
  status: number;
  body: T;
}

const servers = new Set<http.Server>();

const startServer = async (router: Router, basePath: string) => {
  const app = express();
  app.use(express.json());
  app.use(basePath, router);
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

  return {
    request: async <T = unknown>(
      path: string,
      init?: { method?: string; body?: unknown },
    ): Promise<TestResponse<T>> => {
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
        method: init?.method ?? 'GET',
        headers: {
          'content-type': 'application/json',
        },
        body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      });

      return {
        status: response.status,
        body: (await response.json()) as T,
      };
    },
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

export { startServer };
