import { eq } from 'drizzle-orm';
import { Branch } from '../../../domain/entities';
import { BranchRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toBranchEntity } from '../mappers';
import { branchesTable } from '../schema';

export class BranchDrizzleRepository implements BranchRepository {
  async create(data: Omit<Branch, 'id' | 'createdAt'>): Promise<Branch> {
    const [row] = await drizzleDb
      .insert(branchesTable)
      .values({
        businessId: data.businessId,
        address: data.address,
        phone: data.phone,
        city: data.city,
        pricePerM2: data.pricePerM2,
        fixedPrice: data.fixedPrice,
        frequencyDays: data.frequencyDays,
        reinforcementDays: data.reinforcementDays,
        reinforcementEnabled: data.reinforcementEnabled,
        reinforcementIsPaid: data.reinforcementIsPaid,
        technicianRevenueMode: data.technicianRevenueMode,
      })
      .returning();

    return toBranchEntity(row);
  }

  async findById(id: string): Promise<Branch | null> {
    const [row] = await drizzleDb
      .select()
      .from(branchesTable)
      .where(eq(branchesTable.id, id))
      .limit(1);

    return row ? toBranchEntity(row) : null;
  }

  async findByBusinessId(businessId: string): Promise<Branch[]> {
    const rows = await drizzleDb
      .select()
      .from(branchesTable)
      .where(eq(branchesTable.businessId, businessId));

    return rows.map(toBranchEntity);
  }

  async update(
    id: string,
    data: Partial<Omit<Branch, 'id' | 'businessId' | 'createdAt'>>,
  ): Promise<Branch> {
    const [row] = await drizzleDb
      .update(branchesTable)
      .set(data)
      .where(eq(branchesTable.id, id))
      .returning();

    if (!row) {
      throw new Error(`Branch not found: ${id}`);
    }

    return toBranchEntity(row);
  }

  async findWithConfiguration(id: string): Promise<Branch | null> {
    const [row] = await drizzleDb
      .select()
      .from(branchesTable)
      .where(eq(branchesTable.id, id))
      .limit(1);

    return row ? toBranchEntity(row) : null;
  }
}
