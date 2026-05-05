import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../../../application/errors';
import { createClientController } from '../client.controller';
import { createClientRoutes } from '../../routes/client.routes';
import { startServer } from './http-test.helper';

const buildUseCases = () => ({
  createInitialClient: vi.fn(),
  listClients: vi.fn(),
  searchClientsByName: vi.fn(),
  getClientById: vi.fn(),
  addBusinessToClient: vi.fn(),
  addBranchToBusiness: vi.fn(),
});

describe('client routes', () => {
  it('POST /api/clients responde 201 y { data }', async () => {
    const useCases = buildUseCases();
    useCases.createInitialClient.mockResolvedValue({ client: { id: 'client-1' } });

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients', {
      method: 'POST',
      body: {
        client: { name: 'Cliente' },
        businessName: 'Negocio',
        branch: { address: 'Calle 1' },
      },
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: { client: { id: 'client-1' } } });
  });

  it('GET /api/clients responde 200 y lista clientes', async () => {
    const useCases = buildUseCases();
    useCases.listClients.mockResolvedValue([{ id: 'client-1', name: 'Cliente' }]);

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [{ id: 'client-1', name: 'Cliente' }],
    });
  });

  it('GET /api/clients/search?q=abc llama searchClientsByName', async () => {
    const useCases = buildUseCases();
    useCases.searchClientsByName.mockResolvedValue([]);

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/search?q=abc');

    expect(response.status).toBe(200);
    expect(useCases.searchClientsByName).toHaveBeenCalledWith('abc');
  });

  it('GET /api/clients/:id responde 404 cuando no existe', async () => {
    const useCases = buildUseCases();
    useCases.getClientById.mockRejectedValue(new NotFoundError('Client not found: client-1'));

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/client-1');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Client not found: client-1' });
  });

  it('POST /api/clients/:clientId/businesses responde 201', async () => {
    const useCases = buildUseCases();
    useCases.addBusinessToClient.mockResolvedValue({ id: 'business-1' });

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/client-1/businesses', {
      method: 'POST',
      body: { name: 'Negocio 2' },
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: { id: 'business-1' } });
  });

  it('POST /api/clients/businesses/:businessId/branches responde 201', async () => {
    const useCases = buildUseCases();
    useCases.addBranchToBusiness.mockResolvedValue({ branch: { id: 'branch-1' } });

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/businesses/business-1/branches', {
      method: 'POST',
      body: {
        clientId: 'client-1',
        address: 'Cra 10',
      },
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: { branch: { id: 'branch-1' } } });
  });
});
