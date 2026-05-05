import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError, ValidationError } from '../../errors';
import { createServiceUseCases } from '../service.usecases';

const baseService = {
  id: 'service-1',
  branchId: 'branch-1',
  scheduledAt: new Date('2026-05-05T10:00:00.000Z'),
  type: 'main' as const,
  status: 'pending' as const,
  createdBy: 'user-1',
  notes: null,
  paymentMethodId: null,
  paymentProofUrl: null,
  price: 100,
  createdAt: new Date('2026-05-01T10:00:00.000Z'),
};

const baseSettings = {
  id: 'settings-1',
  businessName: 'SR',
  logoUrl: null,
  defaultFrequencyDays: 90,
  defaultReinforcementDays: 20,
  reinforcementEnabledDefault: true,
  reinforcementIsPaidDefault: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseBranch = {
  id: 'branch-1',
  businessId: 'business-1',
  address: 'Street',
  phone: null,
  city: 'Bogota',
  pricePerM2: null,
  fixedPrice: null,
  frequencyDays: 60,
  reinforcementDays: 15,
  reinforcementEnabled: true,
  reinforcementIsPaid: false,
  createdAt: new Date(),
};

const buildDeps = () => ({
  serviceRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    findByScheduledDay: vi.fn(),
    findByMonth: vi.fn(),
    findByTechnicianId: vi.fn(),
    isTechnicianAssigned: vi.fn(),
    assignTechnicians: vi.fn(),
    findTechnicianScheduleConflict: vi.fn(),
  },
  serviceEvidenceRepository: {
    create: vi.fn(),
    listByServiceId: vi.fn(),
  },
  userRepository: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updatePassword: vi.fn(),
    listTechnicians: vi.fn(),
  },
  branchRepository: {
    findById: vi.fn(),
    create: vi.fn(),
    findByBusinessId: vi.fn(),
    update: vi.fn(),
    findWithConfiguration: vi.fn(),
  },
  serviceCycleRepository: {
    create: vi.fn(),
    findByBranchId: vi.fn(),
    update: vi.fn(),
    findUpcomingMainServices: vi.fn(),
    findUpcomingReinforcements: vi.fn(),
  },
  paymentMethodRepository: {
    create: vi.fn(),
    listActive: vi.fn(),
    update: vi.fn(),
    disable: vi.fn(),
  },
  systemSettingsRepository: {
    get: vi.fn(),
    update: vi.fn(),
  },
  storageService: {
    uploadFile: vi.fn(),
  },
  activityLogRepository: {
    create: vi.fn(),
  },
});

describe('service technical usecases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('startService cambia estado', async () => {
    const deps = buildDeps();
    deps.serviceRepository.findById.mockResolvedValue(baseService);
    deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(true);
    deps.serviceRepository.update.mockResolvedValue({
      ...baseService,
      status: 'in_progress',
    });
    const useCases = createServiceUseCases(deps);

    const result = await useCases.startService({
      serviceId: baseService.id,
      actor: {
        userId: 'tech-1',
        role: 'technician',
        isTechnician: true,
      },
    });

    expect(result.status).toBe('in_progress');
  });

  it('completeService cambia estado y actualiza ciclo', async () => {
    const deps = buildDeps();
    deps.serviceRepository.findById
      .mockResolvedValueOnce(baseService)
      .mockResolvedValueOnce({
        ...baseService,
        status: 'completed',
      });
    deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(true);
    deps.serviceRepository.update.mockResolvedValue({
      ...baseService,
      status: 'completed',
    });
    deps.branchRepository.findById.mockResolvedValue(baseBranch);
    deps.systemSettingsRepository.get.mockResolvedValue(baseSettings);
    deps.serviceCycleRepository.findByBranchId.mockResolvedValue({
      id: 'cycle-1',
      branchId: 'branch-1',
      lastServiceDate: null,
      nextMainServiceDate: null,
      nextReinforcementDate: null,
      active: true,
    });
    const useCases = createServiceUseCases(deps);

    const result = await useCases.completeService({
      serviceId: baseService.id,
      actor: {
        userId: 'tech-1',
        role: 'technician',
        isTechnician: true,
      },
    });

    expect(result.status).toBe('completed');
    expect(deps.serviceCycleRepository.update).toHaveBeenCalled();
  });

  it('addServiceNotes funciona', async () => {
    const deps = buildDeps();
    deps.serviceRepository.findById.mockResolvedValue(baseService);
    deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(true);
    deps.serviceRepository.update.mockResolvedValue({
      ...baseService,
      notes: 'done',
    });
    const useCases = createServiceUseCases(deps);

    const result = await useCases.addServiceNotes({
      serviceId: baseService.id,
      actor: {
        userId: 'tech-1',
        role: 'technician',
        isTechnician: true,
      },
      notes: 'done',
    });

    expect(result.notes).toBe('done');
  });

  it('updateServicePayment valida metodo', async () => {
    const deps = buildDeps();
    deps.serviceRepository.findById.mockResolvedValue(baseService);
    deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(true);
    deps.paymentMethodRepository.listActive.mockResolvedValue([]);
    const useCases = createServiceUseCases(deps);

    await expect(
      useCases.updateServicePayment({
        serviceId: baseService.id,
        actor: {
          userId: 'tech-1',
          role: 'technician',
          isTechnician: true,
        },
        paymentMethodId: 'pm-1',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('addPaymentProof guarda URL', async () => {
    const deps = buildDeps();
    deps.serviceRepository.findById.mockResolvedValue(baseService);
    deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(true);
    deps.storageService.uploadFile.mockResolvedValue('https://files/proof.png');
    deps.serviceRepository.update.mockResolvedValue({
      ...baseService,
      paymentProofUrl: 'https://files/proof.png',
    });
    const useCases = createServiceUseCases(deps);

    const result = await useCases.addPaymentProof({
      serviceId: baseService.id,
      actor: {
        userId: 'tech-1',
        role: 'technician',
        isTechnician: true,
      },
      fileName: 'proof.png',
      contentBase64: 'abc',
    });

    expect(result.paymentProofUrl).toBe('https://files/proof.png');
  });

  it('addServiceEvidence guarda evidencia', async () => {
    const deps = buildDeps();
    deps.serviceRepository.findById.mockResolvedValue(baseService);
    deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(true);
    deps.storageService.uploadFile.mockResolvedValue('https://files/evidence.png');
    deps.serviceEvidenceRepository.create.mockResolvedValue({
      id: 'ev-1',
      serviceId: baseService.id,
      imageUrl: 'https://files/evidence.png',
      createdAt: new Date(),
    });
    const useCases = createServiceUseCases(deps);

    const result = await useCases.addServiceEvidence({
      serviceId: baseService.id,
      actor: {
        userId: 'tech-1',
        role: 'technician',
        isTechnician: true,
      },
      fileName: 'evidence.png',
      contentBase64: 'abc',
    });

    expect(result.imageUrl).toBe('https://files/evidence.png');
  });

  it('listServiceEvidences retorna datos', async () => {
    const deps = buildDeps();
    deps.serviceRepository.findById.mockResolvedValue(baseService);
    deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(true);
    deps.serviceEvidenceRepository.listByServiceId.mockResolvedValue([
      {
        id: 'ev-1',
        serviceId: baseService.id,
        imageUrl: 'https://files/evidence.png',
        createdAt: new Date(),
      },
    ]);
    const useCases = createServiceUseCases(deps);

    const result = await useCases.listServiceEvidences({
      serviceId: baseService.id,
      actor: {
        userId: 'tech-1',
        role: 'technician',
        isTechnician: true,
      },
    });

    expect(result).toHaveLength(1);
  });

  it('validacion de permisos funciona', async () => {
    const deps = buildDeps();
    deps.serviceRepository.findById.mockResolvedValue(baseService);
    deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(false);
    const useCases = createServiceUseCases(deps);

    await expect(
      useCases.startService({
        serviceId: baseService.id,
        actor: {
          userId: 'tech-2',
          role: 'technician',
          isTechnician: true,
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('lanza 404 si servicio no existe', async () => {
    const deps = buildDeps();
    deps.serviceRepository.findById.mockResolvedValue(null);
    const useCases = createServiceUseCases(deps);

    await expect(
      useCases.startService({
        serviceId: baseService.id,
        actor: {
          userId: 'admin-1',
          role: 'admin',
          isTechnician: false,
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
