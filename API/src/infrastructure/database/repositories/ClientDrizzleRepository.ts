import { ilike, eq } from 'drizzle-orm';
import { Client } from '../../../domain/entities';
import { ClientRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toClientEntity } from '../mappers';
import { clientsTable } from '../schema';

export class ClientDrizzleRepository implements ClientRepository {
  async create(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const [row] = await drizzleDb
      .insert(clientsTable)
      .values({
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
      })
      .returning();

    return toClientEntity(row);
  }

  async findById(id: string): Promise<Client | null> {
    const [row] = await drizzleDb
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.id, id))
      .limit(1);

    return row ? toClientEntity(row) : null;
  }

  async update(
    id: string,
    data: Partial<Omit<Client, 'id' | 'createdAt'>>,
  ): Promise<Client> {
    const [row] = await drizzleDb
      .update(clientsTable)
      .set(data)
      .where(eq(clientsTable.id, id))
      .returning();

    if (!row) {
      throw new Error(`Client not found: ${id}`);
    }

    return toClientEntity(row);
  }

  async list(): Promise<Client[]> {
    const rows = await drizzleDb.select().from(clientsTable);
    return rows.map(toClientEntity);
  }

  async searchByName(name: string): Promise<Client[]> {
    const rows = await drizzleDb
      .select()
      .from(clientsTable)
      .where(ilike(clientsTable.name, `%${name}%`));

    return rows.map(toClientEntity);
  }
}
