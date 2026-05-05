import { PaymentMethod } from '../entities';

export interface PaymentMethodRepository {
  create(data: Omit<PaymentMethod, 'id' | 'active'>): Promise<PaymentMethod>;
  listActive(): Promise<PaymentMethod[]>;
  update(
    id: string,
    data: Partial<Omit<PaymentMethod, 'id'>>,
  ): Promise<PaymentMethod>;
  disable(id: string): Promise<void>;
}
