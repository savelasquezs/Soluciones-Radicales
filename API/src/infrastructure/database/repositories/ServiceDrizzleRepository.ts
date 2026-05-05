import { and, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { Service } from '../../../domain/entities';
import { ServiceRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toServiceEntity } from '../mappers';
import { serviceTechniciansTable, servicesTable } from '../schema';

export class ServiceDrizzleRepository implements ServiceRepository {
  async create(data: Omit<Service, 'id' | 'createdAt'>): Promise<Service> {
    const [row] = await drizzleDb
      .insert(servicesTable)
      .values({
        branchId: data.branchId,
        scheduledAt: data.scheduledAt,
        type: data.type,
        status: data.status,
        createdBy: data.createdBy,
        notes: data.notes,
        paymentMethodId: data.paymentMethodId,
        paymentProofUrl: data.paymentProofUrl,
        price: data.price,
      })
      .returning();

    return toServiceEntity(row);
  }

  async findById(id: string): Promise<Service | null> {
    const [row] = await drizzleDb
      .select()
      .from(servicesTable)
      .where(eq(servicesTable.id, id))
      .limit(1);

    return row ? toServiceEntity(row) : null;
  }

  async update(
    id: string,
    data: Partial<Omit<Service, 'id' | 'createdAt'>>,
  ): Promise<Service> {
    const [row] = await drizzleDb
      .update(servicesTable)
      .set(data)
      .where(eq(servicesTable.id, id))
      .returning();

    if (!row) {
      throw new Error(`Service not found: ${id}`);
    }

    return toServiceEntity(row);
  }

  async findByScheduledDay(day: Date): Promise<Service[]> {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const rows = await drizzleDb
      .select()
      .from(servicesTable)
      .where(and(gte(servicesTable.scheduledAt, start), lt(servicesTable.scheduledAt, end)));

    return rows.map(toServiceEntity);
  }

  async findByMonth(year: number, month: number): Promise<Service[]> {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);

    const rows = await drizzleDb
      .select()
      .from(servicesTable)
      .where(and(gte(servicesTable.scheduledAt, start), lt(servicesTable.scheduledAt, end)));

    return rows.map(toServiceEntity);
  }

  async findByTechnicianId(technicianId: string): Promise<Service[]> {
    const links = await drizzleDb
      .select({ serviceId: serviceTechniciansTable.serviceId })
      .from(serviceTechniciansTable)
      .where(eq(serviceTechniciansTable.technicianId, technicianId));

    if (links.length === 0) {
      return [];
    }

    const serviceIds = links.map((item) => item.serviceId);
    const rows = await drizzleDb
      .select()
      .from(servicesTable)
      .where(inArray(servicesTable.id, serviceIds));

    return rows.map(toServiceEntity);
  }

  async assignTechnicians(serviceId: string, technicianIds: string[]): Promise<void> {
    await drizzleDb.transaction(async (tx) => {
      await tx
        .delete(serviceTechniciansTable)
        .where(eq(serviceTechniciansTable.serviceId, serviceId));

      if (technicianIds.length === 0) {
        return;
      }

      await tx.insert(serviceTechniciansTable).values(
        technicianIds.map((technicianId) => ({
          serviceId,
          technicianId,
        })),
      );
    });
  }

  async findTechnicianScheduleConflict(
    technicianId: string,
    scheduledAt: Date,
    excludeServiceId?: string,
  ): Promise<Service | null> {
    const condition = excludeServiceId
      ? sql`${serviceTechniciansTable.technicianId} = ${technicianId}
            AND ${servicesTable.scheduledAt} = ${scheduledAt}
            AND ${servicesTable.id} <> ${excludeServiceId}`
      : sql`${serviceTechniciansTable.technicianId} = ${technicianId}
            AND ${servicesTable.scheduledAt} = ${scheduledAt}`;

    const [row] = await drizzleDb
      .select({ service: servicesTable })
      .from(serviceTechniciansTable)
      .innerJoin(servicesTable, eq(serviceTechniciansTable.serviceId, servicesTable.id))
      .where(condition)
      .limit(1);

    // TODO: when service duration is modeled, replace exact datetime check with overlap-range validation.
    return row ? toServiceEntity(row.service) : null;
  }
}

