import { RequestHandler } from 'express';
import type { createSettingsUseCases } from '../../../application/settings/settings.usecases';
import {
  asyncHandler,
  parseOptionalBoolean,
  parseOptionalNumber,
  parseOptionalPaymentMethodType,
  parsePaymentMethodType,
  parseRequiredString,
} from '../request.utils';

type SettingsUseCases = ReturnType<typeof createSettingsUseCases>;

interface SettingsController {
  getSystemSettings: RequestHandler;
  updateSystemSettings: RequestHandler;
  createPaymentMethod: RequestHandler;
  listActivePaymentMethods: RequestHandler;
  updatePaymentMethod: RequestHandler;
  disablePaymentMethod: RequestHandler;
}

export const createSettingsController = (deps: {
  settingsUseCases: Pick<
    SettingsUseCases,
    | 'getSystemSettings'
    | 'updateSystemSettings'
    | 'createPaymentMethod'
    | 'listActivePaymentMethods'
    | 'updatePaymentMethod'
    | 'disablePaymentMethod'
  >;
}): SettingsController => {
  const getSystemSettings = asyncHandler(async (_request, response) => {
    const data = await deps.settingsUseCases.getSystemSettings();
    response.status(200).json({ data });
  });

  const updateSystemSettings = asyncHandler(async (request, response) => {
    const data = await deps.settingsUseCases.updateSystemSettings({
      businessName:
        typeof request.body?.businessName === 'string' ? request.body.businessName : undefined,
      logoUrl: typeof request.body?.logoUrl === 'string' ? request.body.logoUrl : undefined,
      defaultFrequencyDays: parseOptionalNumber(
        request.body?.defaultFrequencyDays,
        'defaultFrequencyDays must be a number',
      ),
      defaultReinforcementDays: parseOptionalNumber(
        request.body?.defaultReinforcementDays,
        'defaultReinforcementDays must be a number',
      ),
      reinforcementEnabledDefault: parseOptionalBoolean(
        request.body?.reinforcementEnabledDefault,
        'reinforcementEnabledDefault must be a boolean',
      ),
      reinforcementIsPaidDefault: parseOptionalBoolean(
        request.body?.reinforcementIsPaidDefault,
        'reinforcementIsPaidDefault must be a boolean',
      ),
      actorUserId:
        typeof request.body?.actorUserId === 'string' ? request.body.actorUserId : undefined,
    });

    response.status(200).json({ data });
  });

  const createPaymentMethod = asyncHandler(async (request, response) => {
    const data = await deps.settingsUseCases.createPaymentMethod({
      name: parseRequiredString(request.body?.name, 'Payment method name is required'),
      type: parsePaymentMethodType(request.body?.type),
      active: parseOptionalBoolean(request.body?.active, 'active must be a boolean'),
      actorUserId:
        typeof request.body?.actorUserId === 'string' ? request.body.actorUserId : undefined,
    });

    response.status(201).json({ data });
  });

  const listActivePaymentMethods = asyncHandler(async (_request, response) => {
    const data = await deps.settingsUseCases.listActivePaymentMethods();
    response.status(200).json({ data });
  });

  const updatePaymentMethod = asyncHandler(async (request, response) => {
    const data = await deps.settingsUseCases.updatePaymentMethod({
      id: parseRequiredString(request.params.id, 'Payment method id is required'),
      name: typeof request.body?.name === 'string' ? request.body.name : undefined,
      type: parseOptionalPaymentMethodType(request.body?.type),
      active: parseOptionalBoolean(request.body?.active, 'active must be a boolean'),
      actorUserId:
        typeof request.body?.actorUserId === 'string' ? request.body.actorUserId : undefined,
    });

    response.status(200).json({ data });
  });

  const disablePaymentMethod = asyncHandler(async (request, response) => {
    await deps.settingsUseCases.disablePaymentMethod(
      parseRequiredString(request.params.id, 'Payment method id is required'),
      typeof request.body?.actorUserId === 'string' ? request.body.actorUserId : undefined,
    );

    response.status(200).json({ data: { success: true } });
  });

  return {
    getSystemSettings,
    updateSystemSettings,
    createPaymentMethod,
    listActivePaymentMethods,
    updatePaymentMethod,
    disablePaymentMethod,
  };
};
