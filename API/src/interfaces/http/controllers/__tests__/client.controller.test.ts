import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../../../application/errors';
import { createClientController } from '../client.controller';
import { createClientRoutes } from '../../routes/client.routes';
import { startServer } from './http-test.helper';

const buildUseCases = () => ({
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
  updateBranchServiceCycle: vi.fn(),
  getBranchHistory: vi.fn(),
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

  it('GET /api/clients/branches/search?q=abc llama searchBranches', async () => {
    const useCases = buildUseCases();
    useCases.searchBranches.mockResolvedValue([]);

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/branches/search?q=abc');

    expect(response.status).toBe(200);
    expect(useCases.searchBranches).toHaveBeenCalledWith('abc');
  });

  it('GET /api/clients/branches/search sin q responde 400', async () => {
    const useCases = buildUseCases();
    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/branches/search');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Search query is required' });
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

  it('GET /api/clients/:id/detail responde 200', async () => {
    const useCases = buildUseCases();
    useCases.getClientDetail.mockResolvedValue({ client: { id: 'client-1' }, businesses: [] });

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/client-1/detail');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { client: { id: 'client-1' }, businesses: [] } });
  });

  it('PATCH /api/clients/:id responde 200', async () => {
    const useCases = buildUseCases();
    useCases.updateClient.mockResolvedValue({ id: 'client-1', name: 'Cliente editado' });

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/client-1', {
      method: 'PATCH',
      body: {
        name: 'Cliente editado',
        contactName: 'Maria',
        phone: '3110000000',
      },
    });

    expect(response.status).toBe(200);
  });

  it('PATCH /api/clients/businesses/:businessId responde 200', async () => {
    const useCases = buildUseCases();
    useCases.updateBusiness.mockResolvedValue({ id: 'business-1', name: 'Negocio editado' });

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/businesses/business-1', {
      method: 'PATCH',
      body: {
        name: 'Negocio editado',
      },
    });

    expect(response.status).toBe(200);
  });

  it('PATCH /api/clients/branches/:branchId responde 200', async () => {
    const useCases = buildUseCases();
    useCases.updateBranch.mockResolvedValue({ id: 'branch-1', address: 'Nueva direccion' });

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/branches/branch-1', {
      method: 'PATCH',
      body: {
        address: 'Nueva direccion',
        phone: '3110000000',
        city: 'Medellin',
        pricePerM2: 20,
        fixedPrice: 200,
      },
    });

    expect(response.status).toBe(200);
  });

  it('PATCH /api/clients/branches/:branchId/configuration responde 200', async () => {
    const useCases = buildUseCases();
    useCases.updateBranchConfiguration.mockResolvedValue({ id: 'branch-1', frequencyDays: 90 });

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/branches/branch-1/configuration', {
      method: 'PATCH',
      body: {
        frequencyDays: 90,
        reinforcementDays: 20,
        reinforcementEnabled: false,
        reinforcementIsPaid: true,
      },
    });

    expect(response.status).toBe(200);
  });

  it('PATCH /api/clients/branches/:branchId/cycle responde 200', async () => {
    const useCases = buildUseCases();
    useCases.updateBranchServiceCycle.mockResolvedValue({
      id: 'cycle-1',
      branchId: 'branch-1',
      lastServiceDate: null,
      nextMainServiceDate: new Date('2026-06-10T09:00:00.000Z'),
      nextReinforcementDate: new Date('2026-06-20T09:00:00.000Z'),
      active: true,
    });

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/branches/branch-1/cycle', {
      method: 'PATCH',
      body: {
        nextMainServiceDate: '2026-06-10T09:00:00.000Z',
        nextReinforcementDate: '2026-06-20T09:00:00.000Z',
      },
    });

    expect(response.status).toBe(200);
  });

  it('PATCH /api/clients/branches/:branchId/configuration rechaza technicianRevenueMode invalido', async () => {
    const useCases = buildUseCases();
    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/branches/branch-1/configuration', {
      method: 'PATCH',
      body: {
        technicianRevenueMode: 'invalid',
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Technician revenue mode must be split or full',
    });
  });

  it('GET /api/clients/branches/:branchId/history responde 200', async () => {
    const useCases = buildUseCases();
    useCases.getBranchHistory.mockResolvedValue({ branch: { id: 'branch-1' }, services: [] });

    const controller = createClientController({ clientUseCases: useCases });
    const server = await startServer(createClientRoutes(controller), '/api/clients');

    const response = await server.request('/api/clients/branches/branch-1/history');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { branch: { id: 'branch-1' }, services: [] } });
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
