import { and, eq, gte, lt, sql } from 'drizzle-orm';
import {
  DashboardAlerts,
  DashboardAnalyticsDimensionPoint,
  DashboardAnalyticsGroupPoint,
  DashboardAnalyticsQuery,
  DashboardFilters,
  DashboardRepository,
  DashboardSummary,
} from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import {
  branchesTable,
  businessesTable,
  clientsTable,
  paymentMethodsTable,
  serviceCyclesTable,
  serviceEvidencesTable,
  serviceTechniciansTable,
  servicesTable,
  usersTable,
} from '../schema';

const withServiceFilters = (filters: DashboardFilters) => {
  const conditions = [] as Array<ReturnType<typeof eq>>;

  if (filters.from) {
    conditions.push(gte(servicesTable.scheduledAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lt(servicesTable.scheduledAt, filters.to));
  }
  if (filters.branchId) {
    conditions.push(eq(servicesTable.branchId, filters.branchId));
  }
  if (filters.status) {
    conditions.push(eq(servicesTable.status, filters.status));
  }
  if (filters.type) {
    conditions.push(eq(servicesTable.type, filters.type));
  }
  if (filters.paymentMethodId) {
    conditions.push(eq(servicesTable.paymentMethodId, filters.paymentMethodId));
  }

  return conditions;
};

export class DrizzleDashboardRepository implements DashboardRepository {
  async getSummary(filters: DashboardFilters): Promise<DashboardSummary> {
    const conditions = withServiceFilters(filters);
    if (filters.businessId || filters.clientId || filters.technicianId) {
      // no-op; handled below via joins
    }

    const rows = await drizzleDb
      .select({
        id: servicesTable.id,
        status: servicesTable.status,
        scheduledAt: servicesTable.scheduledAt,
        price: servicesTable.price,
        clientId: clientsTable.id,
        branchId: branchesTable.id,
      })
      .from(servicesTable)
      .innerJoin(branchesTable, eq(servicesTable.branchId, branchesTable.id))
      .innerJoin(businessesTable, eq(branchesTable.businessId, businessesTable.id))
      .innerJoin(clientsTable, eq(businessesTable.clientId, clientsTable.id))
      .leftJoin(
        serviceTechniciansTable,
        eq(serviceTechniciansTable.serviceId, servicesTable.id),
      )
      .where(
        and(
          ...conditions,
          filters.businessId ? eq(businessesTable.id, filters.businessId) : undefined,
          filters.clientId ? eq(clientsTable.id, filters.clientId) : undefined,
          filters.technicianId
            ? eq(serviceTechniciansTable.technicianId, filters.technicianId)
            : undefined,
        ),
      );

    const uniqueByService = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!uniqueByService.has(row.id)) {
        uniqueByService.set(row.id, row);
      }
    }

    const now = Date.now();
    const services = Array.from(uniqueByService.values());
    const servicesTotal = services.length;
    const servicesCompleted = services.filter((item) => item.status === 'completed').length;
    const servicesPending = services.filter((item) => item.status === 'pending').length;
    const servicesCanceled = services.filter((item) => item.status === 'canceled').length;
    const servicesRescheduled = services.filter((item) => item.status === 'rescheduled').length;
    const overdueServices = services.filter(
      (item) =>
        item.scheduledAt.getTime() < now &&
        item.status !== 'completed' &&
        item.status !== 'canceled',
    ).length;
    const salesTotal = services.reduce((acc, item) => acc + (item.price ?? 0), 0);
    const activeClients = new Set(services.map((item) => item.clientId)).size;
    const activeBranches = new Set(services.map((item) => item.branchId)).size;
    const completionRate = servicesTotal > 0 ? (servicesCompleted / servicesTotal) * 100 : 0;

    return {
      salesTotal,
      servicesTotal,
      servicesCompleted,
      servicesPending,
      servicesCanceled,
      servicesRescheduled,
      overdueServices,
      activeClients,
      activeBranches,
      completionRate,
    };
  }

  async getAnalytics(
    query: DashboardAnalyticsQuery & { sort: 'asc' | 'desc'; limit: number },
  ): Promise<Array<DashboardAnalyticsGroupPoint | DashboardAnalyticsDimensionPoint>> {
    const conditions = withServiceFilters(query);

    const baseRows = await drizzleDb
      .select({
        serviceId: servicesTable.id,
        scheduledAt: servicesTable.scheduledAt,
        status: servicesTable.status,
        type: servicesTable.type,
        price: servicesTable.price,
        paymentMethodId: servicesTable.paymentMethodId,
        paymentMethodName: paymentMethodsTable.name,
        paymentMethodType: paymentMethodsTable.type,
        paymentProofUrl: servicesTable.paymentProofUrl,
        branchId: branchesTable.id,
        branchLabel: branchesTable.address,
        businessId: businessesTable.id,
        businessLabel: businessesTable.name,
        clientId: clientsTable.id,
        clientLabel: clientsTable.name,
        technicianId: serviceTechniciansTable.technicianId,
        technicianLabel: usersTable.name,
        technicianRevenueMode: branchesTable.technicianRevenueMode,
      })
      .from(servicesTable)
      .innerJoin(branchesTable, eq(servicesTable.branchId, branchesTable.id))
      .innerJoin(businessesTable, eq(branchesTable.businessId, businessesTable.id))
      .innerJoin(clientsTable, eq(businessesTable.clientId, clientsTable.id))
      .leftJoin(
        paymentMethodsTable,
        eq(servicesTable.paymentMethodId, paymentMethodsTable.id),
      )
      .leftJoin(
        serviceTechniciansTable,
        eq(serviceTechniciansTable.serviceId, servicesTable.id),
      )
      .leftJoin(usersTable, eq(serviceTechniciansTable.technicianId, usersTable.id))
      .where(
        and(
          ...conditions,
          query.businessId ? eq(businessesTable.id, query.businessId) : undefined,
          query.clientId ? eq(clientsTable.id, query.clientId) : undefined,
          query.technicianId
            ? eq(serviceTechniciansTable.technicianId, query.technicianId)
            : undefined,
        ),
      );

    const evidenceRows = await drizzleDb
      .select({
        serviceId: serviceEvidencesTable.serviceId,
      })
      .from(serviceEvidencesTable);

    const evidenceCountByService = new Map<string, number>();
    for (const row of evidenceRows) {
      evidenceCountByService.set(
        row.serviceId,
        (evidenceCountByService.get(row.serviceId) ?? 0) + 1,
      );
    }

    const uniqueByService = new Map<string, (typeof baseRows)[number]>();
    const technicianCountByService = new Map<string, number>();
    for (const row of baseRows) {
      if (!uniqueByService.has(row.serviceId)) {
        uniqueByService.set(row.serviceId, row);
      }
      if (row.technicianId) {
        technicianCountByService.set(
          row.serviceId,
          (technicianCountByService.get(row.serviceId) ?? 0) + 1,
        );
      }
    }

    const resolveMetricValue = (row: (typeof baseRows)[number]): number => {
      if (query.metric === 'sales') {
        return row.price ?? 0;
      }
      if (query.metric === 'services') {
        return 1;
      }
      if (query.metric === 'completedServices') {
        return row.status === 'completed' ? 1 : 0;
      }
      if (query.metric === 'pendingServices') {
        return row.status === 'pending' ? 1 : 0;
      }
      if (query.metric === 'canceledServices') {
        return row.status === 'canceled' ? 1 : 0;
      }
      if (query.metric === 'rescheduledServices') {
        return row.status === 'rescheduled' ? 1 : 0;
      }
      if (query.metric === 'reinforcements') {
        return row.type === 'reinforcement' ? 1 : 0;
      }
      if (query.metric === 'evidences') {
        return evidenceCountByService.get(row.serviceId) ?? 0;
      }
      if (query.metric === 'completionRate') {
        return row.status === 'completed' ? 1 : 0;
      }
      if (query.metric === 'attributedSales') {
        if (!row.technicianId) {
          return 0;
        }
        const price = row.price ?? 0;
        if (row.technicianRevenueMode === 'full') {
          return price;
        }
        const count = technicianCountByService.get(row.serviceId) ?? 0;
        return count > 0 ? price / count : 0;
      }
      return 0;
    };

    if (query.groupBy) {
      const totals = new Map<string, number>();
      const services = query.metric === 'attributedSales' ? baseRows : Array.from(uniqueByService.values());
      for (const row of services) {
        const period = this.groupPeriod(query.groupBy, row.scheduledAt);
        const value = resolveMetricValue(row);
        totals.set(period, (totals.get(period) ?? 0) + value);
      }

      const result = Array.from(totals.entries()).map(([period, value]) => ({
        period,
        value:
          query.metric === 'completionRate'
            ? (value / Math.max(Array.from(uniqueByService.values()).length, 1)) * 100
            : value,
      }));
      result.sort((a, b) => (query.sort === 'asc' ? a.value - b.value : b.value - a.value));
      return result.slice(0, query.limit);
    }

    if (query.dimension) {
      const totals = new Map<string, DashboardAnalyticsDimensionPoint>();
      const services = query.metric === 'attributedSales' ? baseRows : Array.from(uniqueByService.values());
      for (const row of services) {
        const dimension = this.resolveDimension(query.dimension, row);
        if (!dimension) {
          continue;
        }
        const value = resolveMetricValue(row);
        const current = totals.get(dimension.key);
        if (!current) {
          totals.set(dimension.key, { ...dimension, value });
          continue;
        }
        current.value += value;
      }

      const result = Array.from(totals.values());
      result.sort((a, b) => (query.sort === 'asc' ? a.value - b.value : b.value - a.value));
      return result.slice(0, query.limit);
    }

    const uniqueServices = Array.from(uniqueByService.values());
    const total =
      query.metric === 'attributedSales'
        ? baseRows.reduce((acc, row) => acc + resolveMetricValue(row), 0)
        : uniqueServices.reduce((acc, row) => acc + resolveMetricValue(row), 0);

    return [
      {
        period: 'total',
        value:
          query.metric === 'completionRate'
            ? (uniqueServices.filter((item) => item.status === 'completed').length /
                Math.max(uniqueServices.length, 1)) *
              100
            : total,
      },
    ];
  }

  async getAlerts(filters: DashboardFilters): Promise<DashboardAlerts> {
    const now = new Date();
    const conditions = withServiceFilters(filters);

    const overdueServices = await drizzleDb
      .select()
      .from(servicesTable)
      .where(
        and(
          ...conditions,
          lt(servicesTable.scheduledAt, now),
          sql`${servicesTable.status} not in ('completed', 'canceled')`,
        ),
      );

    const overdueCycles = await drizzleDb
      .select()
      .from(serviceCyclesTable)
      .where(
        and(
          eq(serviceCyclesTable.active, true),
          lt(serviceCyclesTable.nextMainServiceDate, now),
          filters.branchId ? eq(serviceCyclesTable.branchId, filters.branchId) : undefined,
        ),
      );

    const pendingReinforcements = await drizzleDb.execute(sql`
      SELECT s.id AS "mainServiceId", s.branch_id AS "branchId", s.scheduled_at AS "scheduledAt", sc.next_reinforcement_date AS "nextReinforcementDate"
      FROM services s
      INNER JOIN branches b ON b.id = s.branch_id
      INNER JOIN service_cycles sc ON sc.branch_id = b.id
      WHERE s.type = 'main'
        AND s.status = 'completed'
        AND COALESCE(b.reinforcement_enabled, true) = true
        AND sc.next_reinforcement_date IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM services sr
          WHERE sr.branch_id = s.branch_id
            AND sr.type = 'reinforcement'
            AND sr.scheduled_at = sc.next_reinforcement_date
        )
    `);

    const transfersWithoutProof = await drizzleDb
      .select({
        id: servicesTable.id,
        paymentMethodId: servicesTable.paymentMethodId,
        paymentProofUrl: servicesTable.paymentProofUrl,
      })
      .from(servicesTable)
      .leftJoin(paymentMethodsTable, eq(servicesTable.paymentMethodId, paymentMethodsTable.id))
      .where(
        and(
          eq(servicesTable.status, 'completed'),
          sql`${paymentMethodsTable.type} in ('bank', 'transfer')`,
          sql`${servicesTable.paymentProofUrl} is null`,
        ),
      );

    const completedWithoutEvidence = await drizzleDb.execute(sql`
      SELECT s.id
      FROM services s
      LEFT JOIN service_evidences se ON se.service_id = s.id
      WHERE s.status = 'completed'
      GROUP BY s.id
      HAVING COUNT(se.id) = 0
    `);

    return {
      overdueServices,
      overdueCycles,
      pendingReinforcements: pendingReinforcements.rows as Array<Record<string, unknown>>,
      transfersWithoutProof,
      completedWithoutEvidence:
        completedWithoutEvidence.rows as Array<Record<string, unknown>>,
    };
  }

  private groupPeriod(groupBy: DashboardAnalyticsQuery['groupBy'], date: Date): string {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    if (groupBy === 'day') return `${year}-${month}-${day}`;
    if (groupBy === 'week') {
      const first = new Date(Date.UTC(year, 0, 1));
      const diff = Math.floor((date.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
      const week = `${Math.floor(diff / 7) + 1}`.padStart(2, '0');
      return `${year}-W${week}`;
    }
    if (groupBy === 'month') return `${year}-${month}`;
    if (groupBy === 'quarter') return `${year}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
    return `${year}`;
  }

  private resolveDimension(
    dimension: NonNullable<DashboardAnalyticsQuery['dimension']>,
    row: Awaited<ReturnType<DrizzleDashboardRepository['getAnalytics']>> extends Array<infer _T>
      ? any
      : never,
  ): DashboardAnalyticsDimensionPoint | null {
    if (dimension === 'status') {
      return { id: row.status, key: row.status, label: row.status, value: 0 };
    }
    if (dimension === 'serviceType') {
      return { id: row.type, key: row.type, label: row.type, value: 0 };
    }
    if (dimension === 'paymentMethod') {
      const id = row.paymentMethodId ?? 'none';
      const label = row.paymentMethodName ?? 'Sin método';
      return { id, key: id, label, value: 0 };
    }
    if (dimension === 'technician') {
      if (!row.technicianId) return null;
      return {
        id: row.technicianId,
        key: row.technicianId,
        label: row.technicianLabel ?? row.technicianId,
        value: 0,
      };
    }
    if (dimension === 'client') {
      return { id: row.clientId, key: row.clientId, label: row.clientLabel, value: 0 };
    }
    if (dimension === 'business') {
      return { id: row.businessId, key: row.businessId, label: row.businessLabel, value: 0 };
    }
    if (dimension === 'branch') {
      return { id: row.branchId, key: row.branchId, label: row.branchLabel, value: 0 };
    }
    if (dimension === 'paidStatus') {
      const isPaid = row.paymentMethodId ? 'paid' : 'unpaid';
      return { id: isPaid, key: isPaid, label: isPaid, value: 0 };
    }
    return null;
  }
}
