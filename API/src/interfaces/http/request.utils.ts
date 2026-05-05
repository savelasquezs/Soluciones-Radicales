import { NextFunction, Request, RequestHandler, Response } from 'express';
import { PaymentMethodType, ServiceStatus, ServiceType, UserRole } from '../../domain/entities';
import { ValidationError } from '../../application/errors';

const serviceTypes = new Set<ServiceType>(['main', 'reinforcement']);
const serviceStatuses = new Set<ServiceStatus>([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'canceled',
  'rescheduled',
]);
const paymentMethodTypes = new Set<PaymentMethodType>(['cash', 'bank', 'other']);
const userRoles = new Set<UserRole>(['admin']);

export const asyncHandler = (
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void> | void,
): RequestHandler => {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
};

export const parseRequiredString = (value: unknown, message: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(message);
  }

  return value.trim();
};

export const parseOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export const parseRequiredDate = (value: unknown, message: string): Date => {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw new ValidationError(message);
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(message);
  }

  return date;
};

export const parseOptionalDate = (value: unknown, message: string): Date | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return parseRequiredDate(value, message);
};

export const parseOptionalNumber = (value: unknown, message: string): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (Number.isNaN(parsed)) {
    throw new ValidationError(message);
  }

  return parsed;
};

export const parseOptionalBoolean = (value: unknown, message: string): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new ValidationError(message);
};

export const parseStringArray = (value: unknown, message: string): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new ValidationError(message);
  }

  return value.map((item) => item.trim());
};

export const parseServiceType = (value: unknown): ServiceType => {
  const parsed = parseRequiredString(value, 'Service type is required');
  if (!serviceTypes.has(parsed as ServiceType)) {
    throw new ValidationError('Invalid service type');
  }

  return parsed as ServiceType;
};

export const parseServiceStatus = (value: unknown): ServiceStatus => {
  const parsed = parseRequiredString(value, 'Service status is required');
  if (!serviceStatuses.has(parsed as ServiceStatus)) {
    throw new ValidationError('Invalid service status');
  }

  return parsed as ServiceStatus;
};

export const parseOptionalServiceStatus = (value: unknown): ServiceStatus | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return parseServiceStatus(value);
};

export const parsePaymentMethodType = (value: unknown): PaymentMethodType => {
  const parsed = parseRequiredString(value, 'Payment method type is required');
  if (!paymentMethodTypes.has(parsed as PaymentMethodType)) {
    throw new ValidationError('Invalid payment method type');
  }

  return parsed as PaymentMethodType;
};

export const parseOptionalPaymentMethodType = (
  value: unknown,
): PaymentMethodType | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return parsePaymentMethodType(value);
};

export const parseOptionalUserRole = (value: unknown): UserRole | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = parseRequiredString(value, 'Role is required');
  if (!userRoles.has(parsed as UserRole)) {
    throw new ValidationError('Invalid role');
  }

  return parsed as UserRole;
};
