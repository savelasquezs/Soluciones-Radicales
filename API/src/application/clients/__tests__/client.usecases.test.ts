import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../errors';
import { createClientUseCases } from '../client.usecases';

const baseClient = {
  id: 'client-1',
  name: 'Cliente',
  contactName: 'Juan',
  phone: '3001234567',
  createdAt: new Date('2026-05-01T10:00:00.000Z'),
};

const baseBusiness = {
  id: 'business-1',
  clientId: baseClient.id,
  name: 'Negocio 1',
};

const baseBranch = {
  id: 'branch-1',
  businessId: baseBusiness.id,
  address: 'Cra 10',
  phone: '3001234567',
  city: 'Bogota',
  pricePerM2: 10,
  fixedPrice: 100,
  frequencyDays: 60,
  reinforcementDays: 15,
  reinforcementEnabled: true,
  reinforcementIsPaid: false,
  createdAt: new Date('2026-05-01T10:00:00.000Z'),
};

const baseCycle = {
  id: 'cycle-1',
  branchId: baseBranch.id,
  lastServiceDate: null,
  nextMainServiceDate: new Date('2026-06-01T10:00:00.000Z'),
  nextReinforcementDate: null,
  active: true,
};

const baseService = {
  id: 'service-1',
  branchId: baseBranch.id,
  scheduledAt: new Date('2026-05-05T10:00:00.000Z'),
  type: 'main' as const,
  status: 'completed' as const,
  createdBy: 'user-1',
  notes: 'ok',
  paymentMethodId: null,
  paymentProofUrl: null,
  price: 100,
  createdAt: new Date('2026-05-05T12:00:00.000Z'),
};

const buildDeps = () => ({
  clientRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
    searchByName: vi.fn(),
  },
  businessRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByClientId: vi.fn(),
    update: vi.fn(),
  },
  branchRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByBusinessId: vi.fn(),
    update: vi.fn(),
    findWithConfiguration: vi.fn(),
  },
  serviceRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByBranchId: vi.fn(),
    findByBranchAndScheduledAtAndType: vi.fn(),
    update: vi.fn(),
    findByScheduledDay: vi.fn(),
    findByMonth: vi.fn(),
    findByTechnicianId: vi.fn(),
    isTechnicianAssigned: vi.fn(),
    assignTechnicians: vi.fn(),
    findTechnicianScheduleConflict: vi.fn(),
  },
  serviceCycleRepository: {
    create: vi.fn(),
    findByBranchId: vi.fn(),
    update: vi.fn(),
    findUpcomingMainServices: vi.fn(),
    findUpcomingReinforcements: vi.fn(),
  },
  systemSettingsRepository: {
    get: vi.fn(),
    update: vi.fn(),
  },
});

describe('client usecases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getClientDetail retorna cliente con negocios, sucursales y ciclos', async () => {
    const deps = buildDeps();
    deps.clientRepository.findById.mockResolvedValue(baseClient);
    deps.businessRepository.findByClientId.mockResolvedValue([baseBusiness]);
    deps.branchRepository.findByBusinessId.mockResolvedValue([baseBranch]);
    deps.serviceCycleRepository.findByBranchId.mockResolvedValue(baseCycle);
    const useCases = createClientUseCases(deps);

    const result = await useCases.getClientDetail(baseClient.id);

    expect(result).toEqual({
      client: baseClient,
      businesses: [
        {
          business: baseBusiness,
          branches: [
            {
              branch: baseBranch,
              serviceCycle: baseCycle,
            },
          ],
        },
      ],
    });
  });

  it('getClientDetail lanza NotFoundError si cliente no existe', async () => {
    const deps = buildDeps();
    deps.clientRepository.findById.mockResolvedValue(null);
    const useCases = createClientUseCases(deps);

    await expect(useCases.getClientDetail(baseClient.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updateClient actualiza datos basicos', async () => {
    const deps = buildDeps();
    deps.clientRepository.findById.mockResolvedValue(baseClient);
    deps.clientRepository.update.mockResolvedValue({
      ...baseClient,
      name: 'Cliente editado',
      contactName: 'Maria',
      phone: '3110000000',
    });
    const useCases = createClientUseCases(deps);

    const result = await useCases.updateClient({
      clientId: baseClient.id,
      name: 'Cliente editado',
      contactName: 'Maria',
      phone: '3110000000',
    });

    expect(result.name).toBe('Cliente editado');
    expect(deps.clientRepository.update).toHaveBeenCalledWith(baseClient.id, {
      name: 'Cliente editado',
      contactName: 'Maria',
      phone: '3110000000',
    });
  });

  it('updateBusiness actualiza nombre', async () => {
    const deps = buildDeps();
    deps.businessRepository.findById.mockResolvedValue(baseBusiness);
    deps.businessRepository.update.mockResolvedValue({
      ...baseBusiness,
      name: 'Negocio editado',
    });
    const useCases = createClientUseCases(deps);

    const result = await useCases.updateBusiness({
      businessId: baseBusiness.id,
      name: 'Negocio editado',
    });

    expect(result.name).toBe('Negocio editado');
  });

  it('updateBranch actualiza datos y precios sin tocar servicios', async () => {
    const deps = buildDeps();
    deps.branchRepository.findById.mockResolvedValue(baseBranch);
    deps.branchRepository.update.mockResolvedValue({
      ...baseBranch,
      address: 'Nueva direccion',
      pricePerM2: 20,
      fixedPrice: 200,
    });
    const useCases = createClientUseCases(deps);

    const result = await useCases.updateBranch({
      branchId: baseBranch.id,
      address: 'Nueva direccion',
      phone: '3009999999',
      city: 'Medellin',
      pricePerM2: 20,
      fixedPrice: 200,
    });

    expect(result.address).toBe('Nueva direccion');
    expect(result.pricePerM2).toBe(20);
    expect(deps.serviceRepository.update).not.toHaveBeenCalled();
  });

  it('updateBranchConfiguration actualiza frecuencia y refuerzo sin tocar servicios historicos', async () => {
    const deps = buildDeps();
    deps.branchRepository.findById.mockResolvedValue(baseBranch);
    deps.branchRepository.update.mockResolvedValue({
      ...baseBranch,
      frequencyDays: 90,
      reinforcementDays: 20,
      reinforcementEnabled: false,
      reinforcementIsPaid: true,
    });
    const useCases = createClientUseCases(deps);

    const result = await useCases.updateBranchConfiguration({
      branchId: baseBranch.id,
      frequencyDays: 90,
      reinforcementDays: 20,
      reinforcementEnabled: false,
      reinforcementIsPaid: true,
    });

    expect(result.frequencyDays).toBe(90);
    expect(deps.serviceRepository.update).not.toHaveBeenCalled();
    expect(deps.serviceCycleRepository.update).not.toHaveBeenCalled();
  });

  it('getBranchHistory retorna servicios de la sucursal', async () => {
    const deps = buildDeps();
    deps.branchRepository.findById.mockResolvedValue(baseBranch);
    deps.serviceRepository.findByBranchId.mockResolvedValue([baseService]);
    const useCases = createClientUseCases(deps);

    const result = await useCases.getBranchHistory({
      branchId: baseBranch.id,
      status: 'completed',
      type: 'main',
    });

    expect(result).toEqual({
      branch: baseBranch,
      services: [baseService],
    });
    expect(deps.serviceRepository.findByBranchId).toHaveBeenCalledWith(baseBranch.id, {
      from: undefined,
      to: undefined,
      status: 'completed',
      type: 'main',
    });
  });

  it('getBranchHistory lanza NotFoundError si sucursal no existe', async () => {
    const deps = buildDeps();
    deps.branchRepository.findById.mockResolvedValue(null);
    const useCases = createClientUseCases(deps);

    await expect(
      useCases.getBranchHistory({
        branchId: baseBranch.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
