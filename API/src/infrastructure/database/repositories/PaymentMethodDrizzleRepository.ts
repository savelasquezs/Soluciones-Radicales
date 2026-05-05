import { eq } from 'drizzle-orm';
import { PaymentMethod } from '../../../domain/entities';
import { PaymentMethodRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toPaymentMethodEntity } from '../mappers';
import { paymentMethodsTable } from '../schema';

export class PaymentMethodDrizzleRepository implements PaymentMethodRepository {
  async create(data: Omit<PaymentMethod, 'id' | 'active'>): Promise<PaymentMethod> {
    const [row] = await drizzleDb
      .insert(paymentMethodsTable)
      .values({
        name: data.name,
        type: data.type,
      })
      .returning();

    return toPaymentMethodEntity(row);
  }

  async listActive(): Promise<PaymentMethod[]> {
    const rows = await drizzleDb
      .select()
      .from(paymentMethodsTable)
      .where(eq(paymentMethodsTable.active, true));

    return rows.map(toPaymentMethodEntity);
  }

  async update(
    id: string,
    data: Partial<Omit<PaymentMethod, 'id'>>,
  ): Promise<PaymentMethod> {
    const [row] = await drizzleDb
      .update(paymentMethodsTable)
      .set(data)
      .where(eq(paymentMethodsTable.id, id))
      .returning();

    if (!row) {
      throw new Error(`Payment method not found: ${id}`);
    }

    return toPaymentMethodEntity(row);
  }

  async disable(id: string): Promise<void> {
    await drizzleDb
      .update(paymentMethodsTable)
      .set({ active: false })
      .where(eq(paymentMethodsTable.id, id));
  }
}

