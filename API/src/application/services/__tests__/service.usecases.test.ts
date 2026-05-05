import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../errors';
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

const reinforcementService = {
  ...baseService,
  id: 'service-2',
  type: 'reinforcement' as const,
  status: 'confirmed' as const,
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

const adminActor = {
  userId: 'admin-1',
  role: 'admin',
  isTechnician: false,
} as const;

const assignedTechnicianActor = {
  userId: 'tech-1',
  role: 'technician',
  isTechnician: true,
} as const;

const unassignedTechnicianActor = {
  userId: 'tech-2',
  role: 'technician',
  isTechnician: true,
} as const;

const buildDeps = () => ({
  serviceRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByBranchAndScheduledAtAndType: vi.fn(),
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

const setupOperableService = (
  deps: ReturnType<typeof buildDeps>,
  service = baseService,
) => {
  deps.serviceRepository.findById.mockResolvedValue(service);
  deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(true);
};

describe('service technical usecases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('permissions', () => {
    it('admin puede operar cualquier servicio', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue(baseService);
      deps.serviceRepository.update.mockResolvedValue({
        ...baseService,
        status: 'in_progress',
      });
      const useCases = createServiceUseCases(deps);

      const result = await useCases.startService({
        serviceId: baseService.id,
        actor: adminActor,
      });

      expect(result.status).toBe('in_progress');
      expect(deps.serviceRepository.isTechnicianAssigned).not.toHaveBeenCalled();
    });

    it('tecnico asignado puede operar su servicio', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
      deps.serviceRepository.update.mockResolvedValue({
        ...baseService,
        status: 'in_progress',
      });
      const useCases = createServiceUseCases(deps);

      const result = await useCases.startService({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
      });

      expect(result.status).toBe('in_progress');
      expect(deps.serviceRepository.isTechnicianAssigned).toHaveBeenCalledWith(
        baseService.id,
        assignedTechnicianActor.userId,
      );
    });

    it('tecnico no asignado recibe ForbiddenError', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue(baseService);
      deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(false);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.startService({
          serviceId: baseService.id,
          actor: unassignedTechnicianActor,
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('startService', () => {
    it('cambia estado a in_progress', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
      deps.serviceRepository.update.mockResolvedValue({
        ...baseService,
        status: 'in_progress',
      });
      const useCases = createServiceUseCases(deps);

      const result = await useCases.startService({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
      });

      expect(result.status).toBe('in_progress');
      expect(deps.serviceRepository.update).toHaveBeenCalledWith(baseService.id, {
        status: 'in_progress',
      });
    });

    it('lanza NotFoundError si el servicio no existe', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue(null);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.startService({
          serviceId: baseService.id,
          actor: adminActor,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('registra activity log si existe repositorio', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
      deps.serviceRepository.update.mockResolvedValue({
        ...baseService,
        status: 'in_progress',
      });
      const useCases = createServiceUseCases(deps);

      await useCases.startService({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
      });

      expect(deps.activityLogRepository.create).toHaveBeenCalledWith({
        userId: assignedTechnicianActor.userId,
        action: 'service_started',
        entity: 'service',
        entityId: baseService.id,
      });
    });
  });

  describe('completeService', () => {
    it('cambia estado a completed y actualiza service_cycles para servicio main', async () => {
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
        branchId: baseService.branchId,
        lastServiceDate: null,
        nextMainServiceDate: null,
        nextReinforcementDate: null,
        active: true,
      });
      const useCases = createServiceUseCases(deps);

      const result = await useCases.completeService({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
      });

      expect(result.status).toBe('completed');
      expect(deps.serviceRepository.update).toHaveBeenCalledWith(baseService.id, {
        status: 'completed',
      });
      expect(deps.serviceCycleRepository.update).toHaveBeenCalledWith(baseService.branchId, {
        lastServiceDate: baseService.scheduledAt,
        nextMainServiceDate: new Date('2026-07-04T10:00:00.000Z'),
        nextReinforcementDate: new Date('2026-05-20T10:00:00.000Z'),
        active: true,
      });
    });

    it('calcula next_main_service_date y next_reinforcement_date al crear ciclo inexistente', async () => {
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
      deps.serviceCycleRepository.findByBranchId.mockResolvedValue(null);
      deps.serviceCycleRepository.create.mockResolvedValue({
        id: 'cycle-1',
        branchId: baseService.branchId,
        lastServiceDate: baseService.scheduledAt,
        nextMainServiceDate: new Date('2026-07-04T10:00:00.000Z'),
        nextReinforcementDate: new Date('2026-05-20T10:00:00.000Z'),
        active: true,
      });
      const useCases = createServiceUseCases(deps);

      await useCases.completeService({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
      });

      expect(deps.serviceCycleRepository.create).toHaveBeenCalledWith({
        branchId: baseService.branchId,
        lastServiceDate: baseService.scheduledAt,
        nextMainServiceDate: new Date('2026-07-04T10:00:00.000Z'),
        nextReinforcementDate: new Date('2026-05-20T10:00:00.000Z'),
        active: true,
      });
    });

    it('limpia next_reinforcement_date si el servicio completado es reinforcement', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById
        .mockResolvedValueOnce(reinforcementService)
        .mockResolvedValueOnce({
          ...reinforcementService,
          status: 'completed',
        });
      deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(true);
      deps.serviceRepository.update.mockResolvedValue({
        ...reinforcementService,
        status: 'completed',
      });
      deps.branchRepository.findById.mockResolvedValue(baseBranch);
      deps.systemSettingsRepository.get.mockResolvedValue(baseSettings);
      deps.serviceCycleRepository.findByBranchId.mockResolvedValue({
        id: 'cycle-1',
        branchId: reinforcementService.branchId,
        lastServiceDate: baseService.scheduledAt,
        nextMainServiceDate: new Date('2026-07-04T10:00:00.000Z'),
        nextReinforcementDate: new Date('2026-05-20T10:00:00.000Z'),
        active: true,
      });
      const useCases = createServiceUseCases(deps);

      await useCases.completeService({
        serviceId: reinforcementService.id,
        actor: assignedTechnicianActor,
      });

      expect(deps.serviceCycleRepository.update).toHaveBeenCalledWith(
        reinforcementService.branchId,
        {
          nextReinforcementDate: null,
        },
      );
    });

    it('no modifica precio historico', async () => {
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
      deps.serviceCycleRepository.findByBranchId.mockResolvedValue(null);
      const useCases = createServiceUseCases(deps);

      const result = await useCases.completeService({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
      });

      expect(result.price).toBe(baseService.price);
      expect(deps.serviceRepository.update).toHaveBeenCalledWith(baseService.id, {
        status: 'completed',
      });
    });

    it('registra activity log', async () => {
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
      deps.serviceCycleRepository.findByBranchId.mockResolvedValue(null);
      const useCases = createServiceUseCases(deps);

      await useCases.completeService({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
      });

      expect(deps.activityLogRepository.create).toHaveBeenCalledWith({
        userId: assignedTechnicianActor.userId,
        action: 'service_completed',
        entity: 'service',
        entityId: baseService.id,
      });
    });
  });

  describe('addServiceNotes', () => {
    it('actualiza notas sin modificar campos no relacionados', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
      deps.serviceRepository.update.mockResolvedValue({
        ...baseService,
        notes: 'done',
      });
      const useCases = createServiceUseCases(deps);

      const result = await useCases.addServiceNotes({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
        notes: 'done',
      });

      expect(result.notes).toBe('done');
      expect(result.price).toBe(baseService.price);
      expect(result.paymentMethodId).toBe(baseService.paymentMethodId);
      expect(deps.serviceRepository.update).toHaveBeenCalledWith(baseService.id, {
        notes: 'done',
      });
    });

    it('respeta permisos', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue(baseService);
      deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(false);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.addServiceNotes({
          serviceId: baseService.id,
          actor: unassignedTechnicianActor,
          notes: 'done',
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('generateReinforcementService', () => {
    it('genera refuerzo exitosamente para servicio main completado', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue({
        ...baseService,
        status: 'completed',
      });
      deps.branchRepository.findById.mockResolvedValue(baseBranch);
      deps.systemSettingsRepository.get.mockResolvedValue(baseSettings);
      deps.serviceRepository.findByBranchAndScheduledAtAndType.mockResolvedValue(null);
      deps.serviceRepository.create.mockResolvedValue({
        ...reinforcementService,
        scheduledAt: new Date('2026-05-20T10:00:00.000Z'),
        status: 'pending',
        createdBy: adminActor.userId,
        price: 0,
      });
      deps.serviceCycleRepository.findByBranchId.mockResolvedValue({
        id: 'cycle-1',
        branchId: baseService.branchId,
        lastServiceDate: baseService.scheduledAt,
        nextMainServiceDate: new Date('2026-07-04T10:00:00.000Z'),
        nextReinforcementDate: null,
        active: true,
      });
      const useCases = createServiceUseCases(deps);

      const result = await useCases.generateReinforcementService({
        serviceId: baseService.id,
        actor: adminActor,
      });

      expect(result.type).toBe('reinforcement');
      expect(result.status).toBe('pending');
      expect(result.scheduledAt).toEqual(new Date('2026-05-20T10:00:00.000Z'));
      expect(deps.serviceRepository.create).toHaveBeenCalledWith({
        branchId: baseService.branchId,
        scheduledAt: new Date('2026-05-20T10:00:00.000Z'),
        type: 'reinforcement',
        status: 'pending',
        createdBy: adminActor.userId,
        notes: null,
        paymentMethodId: null,
        paymentProofUrl: null,
        price: 0,
      });
    });

    it('falla si servicio no existe', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue(null);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.generateReinforcementService({
          serviceId: baseService.id,
          actor: adminActor,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('falla si el actor no es admin', async () => {
      const deps = buildDeps();
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.generateReinforcementService({
          serviceId: baseService.id,
          actor: assignedTechnicianActor,
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('falla si servicio no es main', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue({
        ...reinforcementService,
        status: 'completed',
      });
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.generateReinforcementService({
          serviceId: reinforcementService.id,
          actor: adminActor,
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('falla si servicio no esta completed', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue(baseService);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.generateReinforcementService({
          serviceId: baseService.id,
          actor: adminActor,
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('falla si refuerzo esta deshabilitado', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue({
        ...baseService,
        status: 'completed',
      });
      deps.branchRepository.findById.mockResolvedValue({
        ...baseBranch,
        reinforcementEnabled: false,
      });
      deps.systemSettingsRepository.get.mockResolvedValue(baseSettings);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.generateReinforcementService({
          serviceId: baseService.id,
          actor: adminActor,
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('precio es 0 si refuerzo no es pago', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue({
        ...baseService,
        status: 'completed',
      });
      deps.branchRepository.findById.mockResolvedValue(baseBranch);
      deps.systemSettingsRepository.get.mockResolvedValue(baseSettings);
      deps.serviceRepository.findByBranchAndScheduledAtAndType.mockResolvedValue(null);
      deps.serviceRepository.create.mockResolvedValue({
        ...reinforcementService,
        status: 'pending',
        scheduledAt: new Date('2026-05-20T10:00:00.000Z'),
        price: 0,
      });
      deps.serviceCycleRepository.findByBranchId.mockResolvedValue(null);
      deps.serviceCycleRepository.create.mockResolvedValue({
        id: 'cycle-1',
        branchId: baseService.branchId,
        lastServiceDate: baseService.scheduledAt,
        nextMainServiceDate: null,
        nextReinforcementDate: new Date('2026-05-20T10:00:00.000Z'),
        active: true,
      });
      const useCases = createServiceUseCases(deps);

      const result = await useCases.generateReinforcementService({
        serviceId: baseService.id,
        actor: adminActor,
      });

      expect(result.price).toBe(0);
    });

    it('usa precio indicado o de sucursal si refuerzo es pago', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue({
        ...baseService,
        status: 'completed',
      });
      deps.branchRepository.findById.mockResolvedValue({
        ...baseBranch,
        fixedPrice: 150,
        reinforcementIsPaid: true,
      });
      deps.systemSettingsRepository.get.mockResolvedValue(baseSettings);
      deps.serviceRepository.findByBranchAndScheduledAtAndType.mockResolvedValue(null);
      deps.serviceRepository.create
        .mockResolvedValueOnce({
          ...reinforcementService,
          status: 'pending',
          scheduledAt: new Date('2026-05-20T10:00:00.000Z'),
          price: 250,
        })
        .mockResolvedValueOnce({
          ...reinforcementService,
          id: 'service-3',
          status: 'pending',
          scheduledAt: new Date('2026-05-20T10:00:00.000Z'),
          price: 150,
        });
      deps.serviceCycleRepository.findByBranchId.mockResolvedValue({
        id: 'cycle-1',
        branchId: baseService.branchId,
        lastServiceDate: baseService.scheduledAt,
        nextMainServiceDate: null,
        nextReinforcementDate: null,
        active: true,
      });
      const useCases = createServiceUseCases(deps);

      const withInputPrice = await useCases.generateReinforcementService({
        serviceId: baseService.id,
        actor: adminActor,
        price: 250,
      });
      const withBranchPrice = await useCases.generateReinforcementService({
        serviceId: baseService.id,
        actor: adminActor,
      });

      expect(withInputPrice.price).toBe(250);
      expect(withBranchPrice.price).toBe(150);
    });

    it('actualiza service_cycle.nextReinforcementDate', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue({
        ...baseService,
        status: 'completed',
      });
      deps.branchRepository.findById.mockResolvedValue(baseBranch);
      deps.systemSettingsRepository.get.mockResolvedValue(baseSettings);
      deps.serviceRepository.findByBranchAndScheduledAtAndType.mockResolvedValue(null);
      deps.serviceRepository.create.mockResolvedValue({
        ...reinforcementService,
        status: 'pending',
        scheduledAt: new Date('2026-05-20T10:00:00.000Z'),
        price: 0,
      });
      deps.serviceCycleRepository.findByBranchId.mockResolvedValue({
        id: 'cycle-1',
        branchId: baseService.branchId,
        lastServiceDate: baseService.scheduledAt,
        nextMainServiceDate: new Date('2026-07-04T10:00:00.000Z'),
        nextReinforcementDate: null,
        active: true,
      });
      const useCases = createServiceUseCases(deps);

      await useCases.generateReinforcementService({
        serviceId: baseService.id,
        actor: adminActor,
      });

      expect(deps.serviceCycleRepository.update).toHaveBeenCalledWith(baseService.branchId, {
        nextReinforcementDate: new Date('2026-05-20T10:00:00.000Z'),
      });
    });

    it('evita duplicado si ya existe refuerzo en misma sucursal y fecha', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue({
        ...baseService,
        status: 'completed',
      });
      deps.branchRepository.findById.mockResolvedValue(baseBranch);
      deps.systemSettingsRepository.get.mockResolvedValue(baseSettings);
      deps.serviceRepository.findByBranchAndScheduledAtAndType.mockResolvedValue({
        ...reinforcementService,
        scheduledAt: new Date('2026-05-20T10:00:00.000Z'),
      });
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.generateReinforcementService({
          serviceId: baseService.id,
          actor: adminActor,
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it('registra activity log', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue({
        ...baseService,
        status: 'completed',
      });
      deps.branchRepository.findById.mockResolvedValue(baseBranch);
      deps.systemSettingsRepository.get.mockResolvedValue(baseSettings);
      deps.serviceRepository.findByBranchAndScheduledAtAndType.mockResolvedValue(null);
      deps.serviceRepository.create.mockResolvedValue({
        ...reinforcementService,
        status: 'pending',
        scheduledAt: new Date('2026-05-20T10:00:00.000Z'),
        price: 0,
      });
      deps.serviceCycleRepository.findByBranchId.mockResolvedValue({
        id: 'cycle-1',
        branchId: baseService.branchId,
        lastServiceDate: baseService.scheduledAt,
        nextMainServiceDate: null,
        nextReinforcementDate: null,
        active: true,
      });
      const useCases = createServiceUseCases(deps);

      await useCases.generateReinforcementService({
        serviceId: baseService.id,
        actor: adminActor,
      });

      expect(deps.activityLogRepository.create).toHaveBeenCalledWith({
        userId: adminActor.userId,
        action: 'service_reinforcement_generated',
        entity: 'service',
        entityId: reinforcementService.id,
      });
    });
  });

  describe('updateServicePayment', () => {
    it('actualiza paymentMethodId', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
      deps.paymentMethodRepository.listActive.mockResolvedValue([
        {
          id: 'pm-1',
          name: 'Bancolombia',
          type: 'bank',
          active: true,
        },
      ]);
      deps.serviceRepository.update.mockResolvedValue({
        ...baseService,
        paymentMethodId: 'pm-1',
      });
      const useCases = createServiceUseCases(deps);

      const result = await useCases.updateServicePayment({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
        paymentMethodId: 'pm-1',
      });

      expect(result.paymentMethodId).toBe('pm-1');
      expect(result.paymentMethod).toEqual({
        id: 'pm-1',
        name: 'Bancolombia',
        type: 'bank',
        active: true,
      });
      expect(deps.serviceRepository.update).toHaveBeenCalledWith(baseService.id, {
        paymentMethodId: 'pm-1',
      });
    });

    it('lanza ValidationError si el metodo no existe o esta inactivo', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
      deps.paymentMethodRepository.listActive.mockResolvedValue([
        {
          id: 'pm-2',
          name: 'Inactivo fuera de lista',
          type: 'other',
          active: true,
        },
      ]);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.updateServicePayment({
          serviceId: baseService.id,
          actor: assignedTechnicianActor,
          paymentMethodId: 'pm-1',
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('no modifica precio historico', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
      deps.paymentMethodRepository.listActive.mockResolvedValue([
        {
          id: 'pm-1',
          name: 'Bancolombia',
          type: 'bank',
          active: true,
        },
      ]);
      deps.serviceRepository.update.mockResolvedValue({
        ...baseService,
        paymentMethodId: 'pm-1',
      });
      const useCases = createServiceUseCases(deps);

      const result = await useCases.updateServicePayment({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
        paymentMethodId: 'pm-1',
      });

      expect(result.price).toBe(baseService.price);
    });

    it('respeta permisos', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue(baseService);
      deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(false);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.updateServicePayment({
          serviceId: baseService.id,
          actor: unassignedTechnicianActor,
          paymentMethodId: 'pm-1',
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('addPaymentProof', () => {
    it('llama storageService.uploadFile y guarda paymentProofUrl', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
      deps.storageService.uploadFile.mockResolvedValue('https://files/proof.png');
      deps.serviceRepository.update.mockResolvedValue({
        ...baseService,
        paymentProofUrl: 'https://files/proof.png',
      });
      const useCases = createServiceUseCases(deps);

      const result = await useCases.addPaymentProof({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
        fileName: 'proof.png',
        contentType: 'image/png',
        contentBase64: 'abc123',
      });

      expect(result.paymentProofUrl).toBe('https://files/proof.png');
      expect(deps.storageService.uploadFile).toHaveBeenCalledWith({
        fileName: 'proof.png',
        contentType: 'image/png',
        contentBase64: 'abc123',
      });
      expect(deps.serviceRepository.update).toHaveBeenCalledWith(baseService.id, {
        paymentProofUrl: 'https://files/proof.png',
      });
    });

    it('no guarda archivo binario', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
      deps.storageService.uploadFile.mockResolvedValue('https://files/proof.png');
      deps.serviceRepository.update.mockResolvedValue({
        ...baseService,
        paymentProofUrl: 'https://files/proof.png',
      });
      const useCases = createServiceUseCases(deps);

      await useCases.addPaymentProof({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
        fileName: 'proof.png',
        contentBase64: 'abc123',
      });

      expect(deps.serviceRepository.update).toHaveBeenCalledWith(baseService.id, {
        paymentProofUrl: 'https://files/proof.png',
      });
      expect(deps.serviceRepository.update).not.toHaveBeenCalledWith(
        baseService.id,
        expect.objectContaining({
          contentBase64: 'abc123',
        }),
      );
    });

    it('respeta permisos', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue(baseService);
      deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(false);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.addPaymentProof({
          serviceId: baseService.id,
          actor: unassignedTechnicianActor,
          fileName: 'proof.png',
          contentBase64: 'abc123',
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('addServiceEvidence', () => {
    it('llama storageService.uploadFile y crea evidencia con URL', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
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
        actor: assignedTechnicianActor,
        fileName: 'evidence.png',
        contentBase64: 'abc',
      });

      expect(result.imageUrl).toBe('https://files/evidence.png');
      expect(deps.storageService.uploadFile).toHaveBeenCalledWith({
        fileName: 'evidence.png',
        contentType: undefined,
        contentBase64: 'abc',
      });
      expect(deps.serviceEvidenceRepository.create).toHaveBeenCalledWith({
        serviceId: baseService.id,
        imageUrl: 'https://files/evidence.png',
      });
    });

    it('permite multiples evidencias', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
      deps.storageService.uploadFile
        .mockResolvedValueOnce('https://files/evidence-1.png')
        .mockResolvedValueOnce('https://files/evidence-2.png');
      deps.serviceEvidenceRepository.create
        .mockResolvedValueOnce({
          id: 'ev-1',
          serviceId: baseService.id,
          imageUrl: 'https://files/evidence-1.png',
          createdAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'ev-2',
          serviceId: baseService.id,
          imageUrl: 'https://files/evidence-2.png',
          createdAt: new Date(),
        });
      const useCases = createServiceUseCases(deps);

      const first = await useCases.addServiceEvidence({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
        fileName: 'evidence-1.png',
        contentBase64: 'abc',
      });
      const second = await useCases.addServiceEvidence({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
        fileName: 'evidence-2.png',
        contentBase64: 'xyz',
      });

      expect(first.id).toBe('ev-1');
      expect(second.id).toBe('ev-2');
      expect(deps.serviceEvidenceRepository.create).toHaveBeenCalledTimes(2);
    });

    it('registra activity log', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
      deps.storageService.uploadFile.mockResolvedValue('https://files/evidence.png');
      deps.serviceEvidenceRepository.create.mockResolvedValue({
        id: 'ev-1',
        serviceId: baseService.id,
        imageUrl: 'https://files/evidence.png',
        createdAt: new Date(),
      });
      const useCases = createServiceUseCases(deps);

      await useCases.addServiceEvidence({
        serviceId: baseService.id,
        actor: assignedTechnicianActor,
        fileName: 'evidence.png',
        contentBase64: 'abc',
      });

      expect(deps.activityLogRepository.create).toHaveBeenCalledWith({
        userId: assignedTechnicianActor.userId,
        action: 'service_evidence_added',
        entity: 'service',
        entityId: baseService.id,
      });
    });

    it('respeta permisos', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue(baseService);
      deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(false);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.addServiceEvidence({
          serviceId: baseService.id,
          actor: unassignedTechnicianActor,
          fileName: 'evidence.png',
          contentBase64: 'abc',
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('listServiceEvidences', () => {
    it('retorna evidencias del servicio', async () => {
      const deps = buildDeps();
      setupOperableService(deps);
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
        actor: assignedTechnicianActor,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.serviceId).toBe(baseService.id);
    });

    it('respeta permisos', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue(baseService);
      deps.serviceRepository.isTechnicianAssigned.mockResolvedValue(false);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.listServiceEvidences({
          serviceId: baseService.id,
          actor: unassignedTechnicianActor,
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('lanza NotFoundError si el servicio no existe', async () => {
      const deps = buildDeps();
      deps.serviceRepository.findById.mockResolvedValue(null);
      const useCases = createServiceUseCases(deps);

      await expect(
        useCases.listServiceEvidences({
          serviceId: baseService.id,
          actor: adminActor,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
