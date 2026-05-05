import express from 'express';
import http from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../../application/errors';
import { errorHandler } from '../error.middleware';

const servers = new Set<http.Server>();

const requestError = async (error: Error) => {
  const app = express();

  app.get('/error', (_request, _response, next) => {
    next(error);
  });
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

  const response = await fetch(`http://127.0.0.1:${address.port}/error`);
  return {
    status: response.status,
    body: (await response.json()) as { message: string },
  };
};

afterEach(async () => {
  await Promise.all(
    Array.from(servers).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((closeError) => {
            if (closeError) {
              reject(closeError);
              return;
            }

            servers.delete(server);
            resolve();
          });
        }),
    ),
  );
});

describe('error middleware', () => {
  it('ValidationError retorna 400', async () => {
    const response = await requestError(new ValidationError('Invalid input'));
    expect(response).toEqual({
      status: 400,
      body: { message: 'Invalid input' },
    });
  });

  it('NotFoundError retorna 404', async () => {
    const response = await requestError(new NotFoundError('Not found'));
    expect(response).toEqual({
      status: 404,
      body: { message: 'Not found' },
    });
  });

  it('ConflictError retorna 409', async () => {
    const response = await requestError(new ConflictError('Conflict'));
    expect(response).toEqual({
      status: 409,
      body: { message: 'Conflict' },
    });
  });

  it('ForbiddenError retorna 403', async () => {
    const response = await requestError(new ForbiddenError('Forbidden'));
    expect(response).toEqual({
      status: 403,
      body: { message: 'Forbidden' },
    });
  });

  it('Error inesperado retorna 500', async () => {
    const response = await requestError(new Error('Unexpected error'));
    expect(response).toEqual({
      status: 500,
      body: { message: 'Unexpected error' },
    });
  });
});
