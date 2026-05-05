import { PaymentMethod, PaymentMethodType, SystemSettings } from '../../domain/entities';

export interface UpdateSystemSettingsInput {
  businessName?: string;
  logoUrl?: string | null;
  defaultFrequencyDays?: number;
  defaultReinforcementDays?: number;
  reinforcementEnabledDefault?: boolean;
  reinforcementIsPaidDefault?: boolean;
  actorUserId?: string | null;
}

export interface CreatePaymentMethodInput {
  name: string;
  type: PaymentMethodType;
  active?: boolean;
  actorUserId?: string | null;
}

export interface UpdatePaymentMethodInput {
  id: string;
  name?: string;
  type?: PaymentMethodType;
  active?: boolean;
  actorUserId?: string | null;
}

export type SystemSettingsOutput = SystemSettings;
export type PaymentMethodOutput = PaymentMethod;

