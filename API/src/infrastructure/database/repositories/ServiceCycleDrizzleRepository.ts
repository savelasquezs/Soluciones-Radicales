import { and, eq, gte, lte } from 'drizzle-orm';
import { ServiceCycle } from '../../../domain/entities';
import { ServiceCycleRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toServiceCycleEntity } from '../mappers';
import { serviceCyclesTable } from '../schema';

export class ServiceCycleDrizzleRepository implements ServiceCycleRepository {
  async create(data: Omit<ServiceCycle, 'id'>): Promise<ServiceCycle> {
    const [row] = await drizzleDb
      .insert(serviceCyclesTable)
      .values({
        branchId: data.branchId,
        lastServiceDate: data.lastServiceDate,
        nextMainServiceDate: data.nextMainServiceDate,
        nextReinforcementDate: data.nextReinforcementDate,
        active: data.active,
      })
      .returning();

    return toServiceCycleEntity(row);
  }

  async findByBranchId(branchId: string): Promise<ServiceCycle | null> {
    const [row] = await drizzleDb
      .select()
      .from(serviceCyclesTable)
      .where(eq(serviceCyclesTable.branchId, branchId))
      .limit(1);

    return row ? toServiceCycleEntity(row) : null;
  }

  async update(
    branchId: string,
    data: Partial<Omit<ServiceCycle, 'id' | 'branchId'>>,
  ): Promise<ServiceCycle> {
    const [row] = await drizzleDb
      .update(serviceCyclesTable)
      .set(data)
      .where(eq(serviceCyclesTable.branchId, branchId))
      .returning();

    if (!row) {
      throw new Error(`Service cycle not found for branch: ${branchId}`);
    }

    return toServiceCycleEntity(row);
  }

  async findUpcomingMainServices(from: Date, to: Date): Promise<ServiceCycle[]> {
    const rows = await drizzleDb
      .select()
      .from(serviceCyclesTable)
      .where(
        and(
          eq(serviceCyclesTable.active, true),
          gte(serviceCyclesTable.nextMainServiceDate, from),
          lte(serviceCyclesTable.nextMainServiceDate, to),
        ),
      );

    return rows.map(toServiceCycleEntity);
  }

  async findUpcomingReinforcements(from: Date, to: Date): Promise<ServiceCycle[]> {
    const rows = await drizzleDb
      .select()
      .from(serviceCyclesTable)
      .where(
        and(
          eq(serviceCyclesTable.active, true),
          gte(serviceCyclesTable.nextReinforcementDate, from),
          lte(serviceCyclesTable.nextReinforcementDate, to),
        ),
      );

    return rows.map(toServiceCycleEntity);
  }
}

