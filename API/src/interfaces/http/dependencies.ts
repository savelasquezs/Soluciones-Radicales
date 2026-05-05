import { createClientUseCases } from '../../application/clients/client.usecases';
import { createServiceUseCases } from '../../application/services/service.usecases';
import { createSettingsUseCases } from '../../application/settings/settings.usecases';
import { createUserUseCases } from '../../application/users/user.usecases';
import {
  ActivityLogDrizzleRepository,
  BranchDrizzleRepository,
  BusinessDrizzleRepository,
  ClientDrizzleRepository,
  PaymentMethodDrizzleRepository,
  ServiceCycleDrizzleRepository,
  ServiceDrizzleRepository,
  SystemSettingsDrizzleRepository,
  UserDrizzleRepository,
} from '../../infrastructure/database/repositories';

export const createHttpDependencies = () => {
  const activityLogRepository = new ActivityLogDrizzleRepository();
  const branchRepository = new BranchDrizzleRepository();
  const businessRepository = new BusinessDrizzleRepository();
  const clientRepository = new ClientDrizzleRepository();
  const paymentMethodRepository = new PaymentMethodDrizzleRepository();
  const serviceCycleRepository = new ServiceCycleDrizzleRepository();
  const serviceRepository = new ServiceDrizzleRepository();
  const systemSettingsRepository = new SystemSettingsDrizzleRepository();
  const userRepository = new UserDrizzleRepository();

  return {
    clientUseCases: createClientUseCases({
      clientRepository,
      businessRepository,
      branchRepository,
      serviceCycleRepository,
      systemSettingsRepository,
    }),
    serviceUseCases: createServiceUseCases({
      serviceRepository,
      userRepository,
      branchRepository,
      serviceCycleRepository,
      systemSettingsRepository,
      activityLogRepository,
    }),
    userUseCases: createUserUseCases({
      userRepository,
      activityLogRepository,
    }),
    settingsUseCases: createSettingsUseCases({
      systemSettingsRepository,
      paymentMethodRepository,
      activityLogRepository,
    }),
  };
};
