import {
  ActivityLogRepository,
  PaymentMethodRepository,
  SystemSettingsRepository,
} from '../../domain/repositories';
import { NotFoundError, ValidationError } from '../errors';
import {
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
  UpdateSystemSettingsInput,
} from './settings.types';

interface SettingsUseCasesDeps {
  systemSettingsRepository: SystemSettingsRepository;
  paymentMethodRepository: PaymentMethodRepository;
  activityLogRepository?: ActivityLogRepository;
}

export const createSettingsUseCases = (deps: SettingsUseCasesDeps) => {
  const logActivity = async (
    action: string,
    entity: string,
    entityId: string,
    userId?: string | null,
  ) => {
    if (!deps.activityLogRepository) {
      return;
    }
    await deps.activityLogRepository.create({
      userId: userId ?? null,
      action,
      entity,
      entityId,
    });
  };

  const getSystemSettings = async () => {
    const settings = await deps.systemSettingsRepository.get();
    if (!settings) {
      throw new NotFoundError('System settings not found');
    }
    return settings;
  };

  const updateSystemSettings = async (input: UpdateSystemSettingsInput) => {
    const updated = await deps.systemSettingsRepository.update({
      businessName: input.businessName,
      logoUrl: input.logoUrl,
      defaultFrequencyDays: input.defaultFrequencyDays,
      defaultReinforcementDays: input.defaultReinforcementDays,
      reinforcementEnabledDefault: input.reinforcementEnabledDefault,
      reinforcementIsPaidDefault: input.reinforcementIsPaidDefault,
    });

    await logActivity(
      'system_settings_updated',
      'system_settings',
      updated.id,
      input.actorUserId ?? null,
    );
    return updated;
  };

  const createPaymentMethod = async (input: CreatePaymentMethodInput) => {
    if (!input.name.trim()) {
      throw new ValidationError('Payment method name is required');
    }

    const created = await deps.paymentMethodRepository.create({
      name: input.name,
      type: input.type,
    });

    let output = created;
    if (input.active === false) {
      await deps.paymentMethodRepository.disable(created.id);
      output = {
        ...created,
        active: false,
      };
    }

    await logActivity(
      'payment_method_created',
      'payment_method',
      created.id,
      input.actorUserId ?? null,
    );
    return output;
  };

  const listActivePaymentMethods = async () => deps.paymentMethodRepository.listActive();

  const updatePaymentMethod = async (input: UpdatePaymentMethodInput) => {
    const activeMethods = await deps.paymentMethodRepository.listActive();
    const target = activeMethods.find((method) => method.id === input.id);

    if (!target && input.active !== false) {
      throw new NotFoundError(`Payment method not found or inactive: ${input.id}`);
    }

    let updated = await deps.paymentMethodRepository.update(input.id, {
      name: input.name,
      type: input.type,
      active: input.active,
    });

    if (input.active === false) {
      await deps.paymentMethodRepository.disable(input.id);
      updated = {
        ...updated,
        active: false,
      };
    }

    await logActivity(
      'payment_method_updated',
      'payment_method',
      updated.id,
      input.actorUserId ?? null,
    );
    return updated;
  };

  const disablePaymentMethod = async (id: string, actorUserId?: string | null) => {
    await deps.paymentMethodRepository.disable(id);
    await logActivity('payment_method_disabled', 'payment_method', id, actorUserId ?? null);
  };

  return {
    getSystemSettings,
    updateSystemSettings,
    createPaymentMethod,
    listActivePaymentMethods,
    updatePaymentMethod,
    disablePaymentMethod,
  };
};

