import {
  ActivityLogRepository,
  BranchRepository,
  ServiceCycleRepository,
  ServiceRepository,
  SystemSettingsRepository,
  UserRepository,
} from '../../domain/repositories';
import { ConflictError, NotFoundError, ValidationError } from '../errors';
import {
  AssignTechniciansInput,
  CreateServiceInput,
  GetTechnicianScheduleInput,
  GetTechnicianScheduleOutput,
  UpcomingServicesOutput,
  UpdateServiceStatusInput,
  RescheduleServiceInput,
} from './service.types';

interface ServiceUseCasesDeps {
  serviceRepository: ServiceRepository;
  userRepository: UserRepository;
  branchRepository: BranchRepository;
  serviceCycleRepository: ServiceCycleRepository;
  systemSettingsRepository: SystemSettingsRepository;
  activityLogRepository?: ActivityLogRepository;
}

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const createServiceUseCases = (deps: ServiceUseCasesDeps) => {
  const logActivity = async (
    action: string,
    entityId: string,
    userId?: string | null,
  ) => {
    if (!deps.activityLogRepository) {
      return;
    }
    await deps.activityLogRepository.create({
      userId: userId ?? null,
      action,
      entity: 'service',
      entityId,
    });
  };

  const resolveBranchSettings = async (branchId: string) => {
    const branch = await deps.branchRepository.findById(branchId);
    if (!branch) {
      throw new NotFoundError(`Branch not found: ${branchId}`);
    }

    const settings = await deps.systemSettingsRepository.get();
    if (!settings) {
      throw new NotFoundError('System settings not found');
    }

    return {
      branch,
      frequencyDays: branch.frequencyDays ?? settings.defaultFrequencyDays,
      reinforcementDays: branch.reinforcementDays ?? settings.defaultReinforcementDays,
      reinforcementEnabled:
        branch.reinforcementEnabled ?? settings.reinforcementEnabledDefault,
      reinforcementIsPaid:
        branch.reinforcementIsPaid ?? settings.reinforcementIsPaidDefault,
    };
  };

  const createService = async (input: CreateServiceInput) => {
    if (!input.branchId.trim()) {
      throw new ValidationError('Branch id is required');
    }

    const branchSettings = await resolveBranchSettings(input.branchId);
    const price =
      input.type === 'reinforcement' && !branchSettings.reinforcementIsPaid
        ? 0
        : input.price ?? null;

    const service = await deps.serviceRepository.create({
      branchId: input.branchId,
      scheduledAt: input.scheduledAt,
      type: input.type,
      status: input.status ?? 'pending',
      createdBy: input.createdBy ?? null,
      notes: input.notes ?? null,
      paymentMethodId: input.paymentMethodId ?? null,
      paymentProofUrl: input.paymentProofUrl ?? null,
      price,
    });

    // TODO: generate reinforcement automatically when a main service is completed.
    await logActivity('service_created', service.id, input.createdBy ?? null);
    return service;
  };

  const assignTechniciansToService = async (input: AssignTechniciansInput) => {
    const service = await deps.serviceRepository.findById(input.serviceId);
    if (!service) {
      throw new NotFoundError(`Service not found: ${input.serviceId}`);
    }

    if (input.technicianIds.length === 0) {
      throw new ValidationError('At least one technician is required');
    }

    for (const technicianId of input.technicianIds) {
      const user = await deps.userRepository.findById(technicianId);
      if (!user) {
        throw new NotFoundError(`User not found: ${technicianId}`);
      }
      if (!user.isTechnician) {
        throw new ValidationError(`User is not technician: ${technicianId}`);
      }

      const conflict = await deps.serviceRepository.findTechnicianScheduleConflict(
        technicianId,
        service.scheduledAt,
        service.id,
      );
      if (conflict) {
        throw new ConflictError(
          `Technician ${technicianId} already has a service at scheduled time`,
        );
      }
    }

    await deps.serviceRepository.assignTechnicians(input.serviceId, input.technicianIds);
    await logActivity(
      'service_technicians_assigned',
      input.serviceId,
      input.actorUserId ?? null,
    );
  };

  const updateServiceStatus = async (input: UpdateServiceStatusInput) => {
    const service = await deps.serviceRepository.findById(input.serviceId);
    if (!service) {
      throw new NotFoundError(`Service not found: ${input.serviceId}`);
    }

    const updated = await deps.serviceRepository.update(service.id, {
      status: input.status,
    });

    if (input.status === 'completed') {
      const branchSettings = await resolveBranchSettings(service.branchId);
      const currentCycle = await deps.serviceCycleRepository.findByBranchId(service.branchId);

      if (service.type === 'main') {
        const nextMainDate = addDays(
          service.scheduledAt,
          branchSettings.frequencyDays,
        );
        const nextReinforcementDate = branchSettings.reinforcementEnabled
          ? addDays(service.scheduledAt, branchSettings.reinforcementDays)
          : null;

        if (currentCycle) {
          await deps.serviceCycleRepository.update(service.branchId, {
            lastServiceDate: service.scheduledAt,
            nextMainServiceDate: nextMainDate,
            nextReinforcementDate,
            active: true,
          });
        } else {
          await deps.serviceCycleRepository.create({
            branchId: service.branchId,
            lastServiceDate: service.scheduledAt,
            nextMainServiceDate: nextMainDate,
            nextReinforcementDate,
            active: true,
          });
        }
      }

      if (service.type === 'reinforcement' && currentCycle) {
        await deps.serviceCycleRepository.update(service.branchId, {
          nextReinforcementDate: null,
        });
      }
    }

    await logActivity(
      'service_status_updated',
      service.id,
      input.actorUserId ?? null,
    );
    return updated;
  };

  const getServiceById = async (id: string) => {
    const service = await deps.serviceRepository.findById(id);
    if (!service) {
      throw new NotFoundError(`Service not found: ${id}`);
    }
    return service;
  };

  const getServicesByDay = async (day: Date) => deps.serviceRepository.findByScheduledDay(day);

  const getServicesByMonth = async (year: number, month: number) =>
    deps.serviceRepository.findByMonth(year, month);

  const getTechnicianSchedule = async (
    input: GetTechnicianScheduleInput,
  ): Promise<GetTechnicianScheduleOutput> => {
    const user = await deps.userRepository.findById(input.technicianId);
    if (!user) {
      throw new NotFoundError(`User not found: ${input.technicianId}`);
    }
    if (!user.isTechnician) {
      throw new ValidationError('User is not technician');
    }

    let services = await deps.serviceRepository.findByTechnicianId(input.technicianId);
    if (input.from || input.to) {
      services = services.filter((item) => {
        const fromOk = input.from ? item.scheduledAt >= input.from : true;
        const toOk = input.to ? item.scheduledAt <= input.to : true;
        return fromOk && toOk;
      });
    }

    return {
      technician: {
        id: user.id,
        name: user.name,
        email: user.email,
        isTechnician: user.isTechnician,
      },
      services,
    };
  };

  const getUpcomingServices = async (rangeDays = 7): Promise<UpcomingServicesOutput> => {
    const from = new Date();
    const to = addDays(from, rangeDays);

    const mainCycles = await deps.serviceCycleRepository.findUpcomingMainServices(from, to);
    const reinforcementCycles =
      await deps.serviceCycleRepository.findUpcomingReinforcements(from, to);

    const mapCycleWithBranch = async (cycle: (typeof mainCycles)[number]) => {
      const branch = await deps.branchRepository.findById(cycle.branchId);
      return {
        cycle,
        branch: branch
          ? {
              id: branch.id,
              businessId: branch.businessId,
              address: branch.address,
              city: branch.city,
            }
          : null,
      };
    };

    return {
      mainServices: await Promise.all(mainCycles.map(mapCycleWithBranch)),
      reinforcements: await Promise.all(reinforcementCycles.map(mapCycleWithBranch)),
    };
  };

  const rescheduleService = async (input: RescheduleServiceInput) => {
    const service = await deps.serviceRepository.findById(input.serviceId);
    if (!service) {
      throw new NotFoundError(`Service not found: ${input.serviceId}`);
    }

    const updated = await deps.serviceRepository.update(service.id, {
      scheduledAt: input.scheduledAt,
      status: 'rescheduled',
    });

    await logActivity('service_rescheduled', service.id, input.actorUserId ?? null);
    return updated;
  };

  const cancelService = async (serviceId: string, actorUserId?: string | null) => {
    const service = await deps.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundError(`Service not found: ${serviceId}`);
    }

    const updated = await deps.serviceRepository.update(service.id, {
      status: 'canceled',
    });
    await logActivity('service_canceled', service.id, actorUserId ?? null);
    return updated;
  };

  return {
    createService,
    assignTechniciansToService,
    updateServiceStatus,
    getServiceById,
    getServicesByDay,
    getServicesByMonth,
    getTechnicianSchedule,
    getUpcomingServices,
    rescheduleService,
    cancelService,
  };
};

