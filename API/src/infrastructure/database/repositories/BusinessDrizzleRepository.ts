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

  async findByClientId(clientId: string): Promise<Business[]> {
    const rows = await drizzleDb
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.clientId, clientId));

    return rows.map(toBusinessEntity);
  }
}

