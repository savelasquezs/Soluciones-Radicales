import { and, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { Service } from '../../../domain/entities';
import { ServiceRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toServiceEntity } from '../mappers';
import {
  branchesTable,
  businessesTable,
  clientsTable,
  paymentMethodsTable,
  serviceTechniciansTable,
  servicesTable,
  usersTable,
} from '../schema';

export class ServiceDrizzleRepository implements ServiceRepository {
  private async getTechniciansByServiceIds(serviceIds: string[]) {
    if (!serviceIds.length) {
      return new Map<string, Array<{ id: string; name: string }>>();
    }

    const rows = await drizzleDb
      .select({
        serviceId: serviceTechniciansTable.serviceId,
        technicianId: usersTable.id,
        technicianName: usersTable.name,
      })
      .from(serviceTechniciansTable)
      .innerJoin(usersTable, eq(serviceTechniciansTable.technicianId, usersTable.id))
      .where(inArray(serviceTechniciansTable.serviceId, serviceIds));

    const map = new Map<string, Array<{ id: string; name: string }>>();
    for (const row of rows) {
      const bucket = map.get(row.serviceId) ?? [];
      bucket.push({ id: row.technicianId, name: row.technicianName });
      map.set(row.serviceId, bucket);
    }

    return map;
  }

  private async mapJoinedRows(
    rows: Array<{
      service: typeof servicesTable.$inferSelect;
      branchAddress: string | null;
      branchPhone: string | null;
      businessName: string | null;
      clientName: string | null;
      clientPhone: string | null;
      paymentMethodName: string | null;
    }>,
  ): Promise<Service[]> {
    const baseServices = rows.map((row) => {
      const service = toServiceEntity(row.service);
      return {
        ...service,
        branchAddress: row.branchAddress,
        branchPhone: row.branchPhone,
        businessName: row.businessName,
        clientName: row.clientName,
        clientPhone: row.clientPhone,
        paymentMethodName: row.paymentMethodName,
        branchName: row.branchAddress,
      };
    });

    const techniciansByService = await this.getTechniciansByServiceIds(
      baseServices.map((item) => item.id),
    );

    return baseServices.map((service) => ({
      ...service,
      technicians: techniciansByService.get(service.id) ?? [],
    }));
  }

  private async findJoinedByCondition(condition: any) {
    const rows = await drizzleDb
      .select({
        service: servicesTable,
        branchAddress: branchesTable.address,
        branchPhone: branchesTable.phone,
        businessName: businessesTable.name,
        clientName: clientsTable.name,
        clientPhone: clientsTable.phone,
        paymentMethodName: paymentMethodsTable.name,
      })
      .from(servicesTable)
      .leftJoin(branchesTable, eq(servicesTable.branchId, branchesTable.id))
      .leftJoin(businessesTable, eq(branchesTable.businessId, businessesTable.id))
      .leftJoin(clientsTable, eq(businessesTable.clientId, clientsTable.id))
      .leftJoin(paymentMethodsTable, eq(servicesTable.paymentMethodId, paymentMethodsTable.id))
      .where(condition);

    return this.mapJoinedRows(rows);
  }

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
    const rows = await this.findJoinedByCondition(eq(servicesTable.id, id));
    return rows[0] ?? null;
  }

  async findByBranchId(
    branchId: string,
    filters?: {
      from?: Date;
      to?: Date;
      status?: Service['status'];
      type?: Service['type'];
    },
  ): Promise<Service[]> {
    const conditions = [eq(servicesTable.branchId, branchId)];

    if (filters?.from) {
      conditions.push(gte(servicesTable.scheduledAt, filters.from));
    }

    if (filters?.to) {
      conditions.push(lt(servicesTable.scheduledAt, filters.to));
    }

    if (filters?.status) {
      conditions.push(eq(servicesTable.status, filters.status));
    }

    if (filters?.type) {
      conditions.push(eq(servicesTable.type, filters.type));
    }

    const rows = await drizzleDb
      .select()
      .from(servicesTable)
      .where(and(...conditions));

    return rows.map(toServiceEntity);
  }

  async findByBranchAndScheduledAtAndType(
    branchId: string,
    scheduledAt: Date,
    type: Service['type'],
  ): Promise<Service | null> {
    const [row] = await drizzleDb
      .select()
      .from(servicesTable)
      .where(
        and(
          eq(servicesTable.branchId, branchId),
          eq(servicesTable.scheduledAt, scheduledAt),
          eq(servicesTable.type, type),
        ),
      )
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

    return this.findJoinedByCondition(
      and(gte(servicesTable.scheduledAt, start), lt(servicesTable.scheduledAt, end)),
    );
  }

  async findByMonth(year: number, month: number): Promise<Service[]> {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);

    return this.findJoinedByCondition(
      and(gte(servicesTable.scheduledAt, start), lt(servicesTable.scheduledAt, end)),
    );
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
    return this.findJoinedByCondition(inArray(servicesTable.id, serviceIds));
  }

  async isTechnicianAssigned(serviceId: string, technicianId: string): Promise<boolean> {
    const [row] = await drizzleDb
      .select({ id: serviceTechniciansTable.id })
      .from(serviceTechniciansTable)
      .where(
        and(
          eq(serviceTechniciansTable.serviceId, serviceId),
          eq(serviceTechniciansTable.technicianId, technicianId),
        ),
      )
      .limit(1);

    return Boolean(row);
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
