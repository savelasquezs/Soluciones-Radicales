import { asc, eq, ilike, or, sql } from 'drizzle-orm';
import { Branch } from '../../../domain/entities';
import { BranchRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toBranchEntity } from '../mappers';
import { branchesTable, businessesTable, clientsTable } from '../schema';

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

  async searchBranchesForService(query: string, limit = 20) {
    const q = query.trim();
    if (!q) {
      return [];
    }

    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 20;
    const likeQuery = `%${q}%`;
    const rankExpr = sql<number>`
      CASE
        WHEN ${clientsTable.name} ILIKE ${likeQuery} OR ${businessesTable.name} ILIKE ${likeQuery} THEN 1
        WHEN ${clientsTable.phone} ILIKE ${likeQuery} OR ${branchesTable.phone} ILIKE ${likeQuery} THEN 2
        WHEN ${branchesTable.address} ILIKE ${likeQuery} THEN 3
        ELSE 4
      END
    `;

    const rows = await drizzleDb
      .select({
        branchId: branchesTable.id,
        branchAddress: branchesTable.address,
        branchPhone: branchesTable.phone,
        businessId: businessesTable.id,
        businessName: businessesTable.name,
        clientId: clientsTable.id,
        clientName: clientsTable.name,
        clientPhone: clientsTable.phone,
        fixedPrice: branchesTable.fixedPrice,
        pricePerM2: branchesTable.pricePerM2,
        city: branchesTable.city,
        rank: rankExpr,
      })
      .from(branchesTable)
      .innerJoin(businessesTable, eq(branchesTable.businessId, businessesTable.id))
      .innerJoin(clientsTable, eq(businessesTable.clientId, clientsTable.id))
      .where(
        or(
          ilike(clientsTable.name, likeQuery),
          ilike(businessesTable.name, likeQuery),
          ilike(clientsTable.phone, likeQuery),
          ilike(branchesTable.phone, likeQuery),
          ilike(branchesTable.address, likeQuery),
        ),
      )
      .orderBy(asc(rankExpr), asc(clientsTable.name), asc(businessesTable.name), asc(branchesTable.address))
      .limit(safeLimit);

    return rows.map(({ rank: _rank, ...item }) => item);
  }
}
