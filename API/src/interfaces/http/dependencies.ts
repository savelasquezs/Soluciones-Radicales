import { createAuthUseCases } from '../../application/auth/auth.usecases';
import { createClientUseCases } from '../../application/clients/client.usecases';
import { createServiceUseCases } from '../../application/services/service.usecases';
import { createSettingsUseCases } from '../../application/settings/settings.usecases';
import { createUserUseCases } from '../../application/users/user.usecases';
import {
  comparePassword,
  hashPassword,
} from '../../infrastructure/auth/password.service';
import {
  generateRandomToken,
  hashToken,
} from '../../infrastructure/auth/token-hash.service';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../infrastructure/auth/jwt.service';
import {
  ActivityLogDrizzleRepository,
  BranchDrizzleRepository,
  BusinessDrizzleRepository,
  ClientDrizzleRepository,
  DrizzlePasswordResetTokenRepository,
  DrizzleRefreshTokenRepository,
  PaymentMethodDrizzleRepository,
  ServiceCycleDrizzleRepository,
  ServiceDrizzleRepository,
  SystemSettingsDrizzleRepository,
  UserDrizzleRepository,
} from '../../infrastructure/database/repositories';
import { sendPasswordResetEmail } from '../../infrastructure/notifications/email.service';

export const createHttpDependencies = () => {
  const activityLogRepository = new ActivityLogDrizzleRepository();
  const branchRepository = new BranchDrizzleRepository();
  const businessRepository = new BusinessDrizzleRepository();
  const clientRepository = new ClientDrizzleRepository();
  const passwordResetTokenRepository = new DrizzlePasswordResetTokenRepository();
  const paymentMethodRepository = new PaymentMethodDrizzleRepository();
  const refreshTokenRepository = new DrizzleRefreshTokenRepository();
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
    authUseCases: createAuthUseCases({
      userRepository,
      refreshTokenRepository,
      passwordResetTokenRepository,
      passwordService: {
        compare: comparePassword,
        hash: hashPassword,
      },
      jwtService: {
        signAccessToken,
        signRefreshToken,
        verifyRefreshToken,
      },
      tokenHashService: {
        hashToken,
        generateRandomToken,
      },
      emailService: {
        sendPasswordResetEmail,
      },
      activityLogRepository,
    }),
  };
};
