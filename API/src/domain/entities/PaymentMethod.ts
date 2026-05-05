export type PaymentMethodType = 'cash' | 'bank' | 'other';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  active: boolean;
}
