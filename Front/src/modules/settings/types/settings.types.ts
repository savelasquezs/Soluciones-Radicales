import type { ID, PaymentMethodType } from '@/shared/types/common';

export type SystemSettings = {
  businessName: string;
  logoUrl?: string | null;
  defaultFrequencyDays: number;
  defaultReinforcementDays?: number;
  reinforcementEnabledDefault?: boolean;
  reinforcementIsPaidDefault?: boolean;
};

export type UpdateSystemSettingsPayload = Partial<SystemSettings>;

export type PaymentMethod = {
  id: ID;
  name: string;
  type: PaymentMethodType;
  active: boolean;
};

export type CreatePaymentMethodPayload = {
  name: string;
  type: PaymentMethodType;
  active?: boolean;
};

export type UpdatePaymentMethodPayload = {
  name?: string;
  type?: PaymentMethodType;
  active?: boolean;
};
