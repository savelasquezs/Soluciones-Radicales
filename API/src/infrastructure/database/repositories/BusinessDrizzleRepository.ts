import { eq } from 'drizzle-orm';
import { Business } from '../../../domain/entities';
import { BusinessRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toBusinessEntity } from '../mappers';
import { businessesTable } from '../schema';

export class BusinessDrizzleRepository implements BusinessRepository {
  async create(data: Omit<Business, 'id'>): Promise<Business> {
    const [row] = await drizzleDb
      .insert(businessesTable)
      .values({
        clientId: data.clientId,
        name: data.name,
      })
      .returning();

    return toBusinessEntity(row);
  }

  async findById(id: string): Promise<Business | null> {
    const [row] = await drizzleDb
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, id))
      .limit(1);

    return row ? toBusinessEntity(row) : null;
  }

  async findByClientId(clientId: string): Promise<Business[]> {
    const rows = await drizzleDb
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.clientId, clientId));

    return rows.map(toBusinessEntity);
  }

  async update(
    id: string,
    data: Partial<Omit<Business, 'id' | 'clientId'>>,
  ): Promise<Business> {
    const [row] = await drizzleDb
      .update(businessesTable)
      .set(data)
      .where(eq(businessesTable.id, id))
      .returning();

    if (!row) {
      throw new Error(`Business not found: ${id}`);
    }

    return toBusinessEntity(row);
  }
}
