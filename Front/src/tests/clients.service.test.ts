import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientsService } from '@/modules/clients/services/clients.service';
import { endpoints } from '@/shared/api/endpoints';
import { http } from '@/shared/api/http';

vi.mock('@/shared/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('clients.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getClientDetail llama ruta correcta', async () => {
    vi.mocked(http.get).mockResolvedValue({ client: { id: 'c1', name: 'Cliente' }, businesses: [] } as any);

    await clientsService.getClientDetail('client-1');

    expect(http.get).toHaveBeenCalledWith(endpoints.clients.detail('client-1'));
  });

  it('getBranchHistory pasa query params', async () => {
    vi.mocked(http.get).mockResolvedValue({ branch: {}, services: [] } as any);

    await clientsService.getBranchHistory('branch-1', {
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-31T23:59:59.000Z',
      status: 'completed',
      type: 'main',
    });

    expect(http.get).toHaveBeenCalledWith(endpoints.clients.branchHistory('branch-1'), {
      params: {
        from: '2026-05-01T00:00:00.000Z',
        to: '2026-05-31T23:59:59.000Z',
        status: 'completed',
        type: 'main',
      },
    });
  });

  it('createInitialClient envia payload correcto', async () => {
    vi.mocked(http.post).mockResolvedValue({
      client: { id: 'c1', name: 'Cliente', contactName: 'Ana', phone: '300', createdAt: '2026-05-20T00:00:00.000Z' },
      business: { id: 'b1', clientId: 'c1', name: 'Negocio' },
      branch: {
        id: 'br1',
        businessId: 'b1',
        address: 'Calle 1',
        phone: '300',
        city: 'Bogota',
        pricePerM2: 1200,
        fixedPrice: null,
        frequencyDays: 30,
        reinforcementDays: 10,
        reinforcementEnabled: true,
        reinforcementIsPaid: false,
        technicianRevenueMode: 'split',
        createdAt: '2026-05-20T00:00:00.000Z',
      },
      serviceCycle: null,
    } as any);

    const payload = {
      client: { name: 'Cliente', contactName: 'Ana', phone: '300' },
      businessName: 'Negocio',
      branch: { address: 'Calle 1', city: 'Bogota', pricePerM2: 1200, frequencyDays: 30 },
      nextMainServiceDate: '2026-05-25T14:00:00.000Z',
      createService: true,
    } as const;

    await clientsService.createInitialClient(payload);

    expect(http.post).toHaveBeenCalledWith(endpoints.clients.create, payload);
  });

  it('updateBranchCycle llama ruta correcta', async () => {
    vi.mocked(http.patch).mockResolvedValue({
      id: 'cycle-1',
      branchId: 'branch-1',
      active: true,
      lastServiceDate: null,
      nextMainServiceDate: '2026-06-20T10:00:00.000Z',
      nextReinforcementDate: '2026-06-30T10:00:00.000Z',
    } as any);

    await clientsService.updateBranchCycle('branch-1', {
      nextMainServiceDate: '2026-06-20T10:00:00.000Z',
      nextReinforcementDate: '2026-06-30T10:00:00.000Z',
    });

    expect(http.patch).toHaveBeenCalledWith(endpoints.clients.updateBranchCycle('branch-1'), {
      nextMainServiceDate: '2026-06-20T10:00:00.000Z',
      nextReinforcementDate: '2026-06-30T10:00:00.000Z',
    });
  });

  it('normaliza respuesta backend a tipos frontend', async () => {
    vi.mocked(http.get).mockResolvedValue({
      client: {
        id: 'c1',
        name: 'Cliente A',
        contactName: 'Ana',
        phone: '3001234567',
        createdAt: '2026-05-20T00:00:00.000Z',
      },
      businesses: [
        {
          business: { id: 'b1', clientId: 'c1', name: 'Negocio A' },
          branches: [
            {
              branch: {
                id: 'br1',
                businessId: 'b1',
                address: 'Calle 1',
                phone: '3001234567',
                city: 'Bogota',
                pricePerM2: 1200,
                fixedPrice: null,
                frequencyDays: 30,
                reinforcementDays: 10,
                reinforcementEnabled: true,
                reinforcementIsPaid: false,
                technicianRevenueMode: 'full',
                createdAt: '2026-05-20T00:00:00.000Z',
              },
              serviceCycle: {
                id: 'sc1',
                branchId: 'br1',
                active: true,
                lastServiceDate: '2026-05-10T00:00:00.000Z',
                nextMainServiceDate: '2026-06-10T00:00:00.000Z',
                nextReinforcementDate: '2026-05-20T00:00:00.000Z',
              },
            },
          ],
        },
      ],
    } as any);

    const result = await clientsService.getClientDetail('c1');

    expect(result.businesses[0].branches[0].serviceCycle?.lastMainServiceDate).toBe('2026-05-10T00:00:00.000Z');
    expect(result.businesses[0].branches[0].branch.technicianRevenueMode).toBe('full');
    expect(result.client.contactName).toBe('Ana');
  });

  it('searchBranches llama endpoint y normaliza respuesta', async () => {
    vi.mocked(http.get).mockResolvedValue([
      {
        branchId: 'branch-1',
        branchAddress: 'Cra 10 # 20-30',
        branchPhone: '3001234567',
        businessId: 'business-1',
        businessName: 'Negocio A',
        clientId: 'client-1',
        clientName: 'Cliente A',
        clientPhone: '3010000000',
        fixedPrice: 250000,
        pricePerM2: null,
        city: 'Medellín',
      },
    ] as any);

    const result = await clientsService.searchBranches('cliente');

    expect(http.get).toHaveBeenCalledWith(endpoints.clients.searchBranches, {
      params: { q: 'cliente' },
    });
    expect(result[0].branchId).toBe('branch-1');
    expect(result[0].businessName).toBe('Negocio A');
  });
});
