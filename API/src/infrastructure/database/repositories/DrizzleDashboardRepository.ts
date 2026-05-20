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

type ServiceRow = {
  serviceId: string;
  scheduledAt: Date;
  status: string;
  type: string;
  price: number | null;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  paymentMethodType: string | null;
  paymentProofUrl: string | null;
  branchId: string;
  branchLabel: string;
  businessId: string;
  businessLabel: string;
  clientId: string;
  clientLabel: string;
  technicianId: string | null;
  technicianLabel: string | null;
  technicianRevenueMode: string;
};

const withServiceFilters = (filters: DashboardFilters) => {
  const conditions = [] as ReturnType<typeof eq>[];

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

const buildPeriod = (groupBy: NonNullable<DashboardAnalyticsQuery['groupBy']>, date: Date) => {
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
};

const resolveDimension = (
  dimension: NonNullable<DashboardAnalyticsQuery['dimension']>,
  row: ServiceRow,
): DashboardAnalyticsDimensionPoint | null => {
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
};

export class DrizzleDashboardRepository implements DashboardRepository {
  private async fetchServiceRows(filters: DashboardFilters): Promise<ServiceRow[]> {
    const conditions = withServiceFilters(filters);

    const rows = await drizzleDb
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
          filters.businessId ? eq(businessesTable.id, filters.businessId) : undefined,
          filters.clientId ? eq(clientsTable.id, filters.clientId) : undefined,
          filters.technicianId
            ? eq(serviceTechniciansTable.technicianId, filters.technicianId)
            : undefined,
        ),
      );

    return rows as ServiceRow[];
  }

  async getSummary(filters: DashboardFilters): Promise<DashboardSummary> {
    const rows = await this.fetchServiceRows(filters);

    const uniqueByService = new Map<string, ServiceRow>();
    for (const row of rows) {
      if (!uniqueByService.has(row.serviceId)) {
        uniqueByService.set(row.serviceId, row);
      }
    }

    const services = Array.from(uniqueByService.values());
    const now = Date.now();
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
    const rows = await this.fetchServiceRows(query);

    const uniqueByService = new Map<string, ServiceRow>();
    const technicianCountByService = new Map<string, number>();
    for (const row of rows) {
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

    const resolveMetricValue = (row: ServiceRow): number => {
      if (query.metric === 'sales') return row.price ?? 0;
      if (query.metric === 'services') return 1;
      if (query.metric === 'completedServices') return row.status === 'completed' ? 1 : 0;
      if (query.metric === 'pendingServices') return row.status === 'pending' ? 1 : 0;
      if (query.metric === 'canceledServices') return row.status === 'canceled' ? 1 : 0;
      if (query.metric === 'rescheduledServices') return row.status === 'rescheduled' ? 1 : 0;
      if (query.metric === 'reinforcements') return row.type === 'reinforcement' ? 1 : 0;
      if (query.metric === 'evidences') return evidenceCountByService.get(row.serviceId) ?? 0;
      if (query.metric === 'completionRate') return row.status === 'completed' ? 1 : 0;
      if (query.metric === 'attributedSales') {
        if (!row.technicianId) return 0;
        const price = row.price ?? 0;
        if (row.technicianRevenueMode === 'full') return price;
        const count = technicianCountByService.get(row.serviceId) ?? 0;
        return count > 0 ? price / count : 0;
      }
      return 0;
    };

    if (query.groupBy) {
      const source = query.metric === 'attributedSales' ? rows : Array.from(uniqueByService.values());
      const totals = new Map<string, { total: number; completed: number }>();

      for (const row of source) {
        const period = buildPeriod(query.groupBy, row.scheduledAt);
        const current = totals.get(period) ?? { total: 0, completed: 0 };

        if (query.metric === 'completionRate') {
          current.total += 1;
          if (row.status === 'completed') {
            current.completed += 1;
          }
        } else {
          current.total += resolveMetricValue(row);
        }

        totals.set(period, current);
      }

      const result = Array.from(totals.entries()).map(([period, item]) => ({
        period,
        value: query.metric === 'completionRate' ? (item.completed / Math.max(item.total, 1)) * 100 : item.total,
      }));

      result.sort((a, b) => (query.sort === 'asc' ? a.value - b.value : b.value - a.value));
      return result.slice(0, query.limit);
    }

    if (query.dimension) {
      const source = query.metric === 'attributedSales' ? rows : Array.from(uniqueByService.values());
      const totals = new Map<string, { point: DashboardAnalyticsDimensionPoint; total: number; completed: number }>();

      for (const row of source) {
        const point = resolveDimension(query.dimension, row);
        if (!point) {
          continue;
        }

        const current = totals.get(point.key) ?? { point, total: 0, completed: 0 };
        if (query.metric === 'completionRate') {
          current.total += 1;
          if (row.status === 'completed') {
            current.completed += 1;
          }
        } else {
          current.total += resolveMetricValue(row);
        }
        totals.set(point.key, current);
      }

      const result = Array.from(totals.values()).map((item) => ({
        ...item.point,
        value:
          query.metric === 'completionRate'
            ? (item.completed / Math.max(item.total, 1)) * 100
            : item.total,
      }));
      result.sort((a, b) => (query.sort === 'asc' ? a.value - b.value : b.value - a.value));
      return result.slice(0, query.limit);
    }

    const uniqueServices = Array.from(uniqueByService.values());
    if (query.metric === 'completionRate') {
      const completed = uniqueServices.filter((item) => item.status === 'completed').length;
      return [{ period: 'total', value: (completed / Math.max(uniqueServices.length, 1)) * 100 }];
    }

    const total =
      query.metric === 'attributedSales'
        ? rows.reduce((acc, row) => acc + resolveMetricValue(row), 0)
        : uniqueServices.reduce((acc, row) => acc + resolveMetricValue(row), 0);

    return [{ period: 'total', value: total }];
  }

  async getAlerts(filters: DashboardFilters): Promise<DashboardAlerts> {
    const now = Date.now();
    const rows = await this.fetchServiceRows(filters);

    const uniqueByService = new Map<string, ServiceRow>();
    for (const row of rows) {
      if (!uniqueByService.has(row.serviceId)) {
        uniqueByService.set(row.serviceId, row);
      }
    }
    const services = Array.from(uniqueByService.values());
    const branchIds = new Set(services.map((item) => item.branchId));

    const overdueServices = services.filter(
      (item) =>
        item.scheduledAt.getTime() < now &&
        item.status !== 'completed' &&
        item.status !== 'canceled',
    );

    const cycleRows = await drizzleDb
      .select({
        id: serviceCyclesTable.id,
        branchId: serviceCyclesTable.branchId,
        nextMainServiceDate: serviceCyclesTable.nextMainServiceDate,
        active: serviceCyclesTable.active,
        businessId: businessesTable.id,
        clientId: clientsTable.id,
      })
      .from(serviceCyclesTable)
      .innerJoin(branchesTable, eq(serviceCyclesTable.branchId, branchesTable.id))
      .innerJoin(businessesTable, eq(branchesTable.businessId, businessesTable.id))
      .innerJoin(clientsTable, eq(businessesTable.clientId, clientsTable.id))
      .where(
        and(
          eq(serviceCyclesTable.active, true),
          lt(serviceCyclesTable.nextMainServiceDate, new Date()),
          filters.branchId ? eq(serviceCyclesTable.branchId, filters.branchId) : undefined,
          filters.businessId ? eq(businessesTable.id, filters.businessId) : undefined,
          filters.clientId ? eq(clientsTable.id, filters.clientId) : undefined,
        ),
      );

    const overdueCycles = cycleRows.filter(
      (item) => item.nextMainServiceDate && item.nextMainServiceDate.getTime() < now,
    );

    const pendingReinforcementsRaw = await drizzleDb.execute(sql`
      SELECT
        s.id AS "mainServiceId",
        s.branch_id AS "branchId",
        s.scheduled_at AS "scheduledAt",
        sc.next_reinforcement_date AS "nextReinforcementDate"
      FROM services s
      INNER JOIN branches b ON b.id = s.branch_id
      INNER JOIN businesses bs ON bs.id = b.business_id
      INNER JOIN clients c ON c.id = bs.client_id
      INNER JOIN service_cycles sc ON sc.branch_id = b.id
      LEFT JOIN service_technicians st ON st.service_id = s.id
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
        ${filters.from ? sql`AND s.scheduled_at >= ${filters.from}` : sql``}
        ${filters.to ? sql`AND s.scheduled_at < ${filters.to}` : sql``}
        ${filters.branchId ? sql`AND s.branch_id = ${filters.branchId}` : sql``}
        ${filters.businessId ? sql`AND bs.id = ${filters.businessId}` : sql``}
        ${filters.clientId ? sql`AND c.id = ${filters.clientId}` : sql``}
        ${filters.technicianId ? sql`AND st.technician_id = ${filters.technicianId}` : sql``}
    `);

    const transfersWithoutProof = services.filter(
      (item) =>
        item.status === 'completed' &&
        (item.paymentMethodType === 'bank' || item.paymentMethodType === 'transfer') &&
        !item.paymentProofUrl,
    );

    const evidenceRows = await drizzleDb
      .select({ serviceId: serviceEvidencesTable.serviceId })
      .from(serviceEvidencesTable);
    const evidenceServiceIds = new Set(evidenceRows.map((item) => item.serviceId));

    const completedWithoutEvidence = services.filter(
      (item) => item.status === 'completed' && !evidenceServiceIds.has(item.serviceId),
    );

    return {
      overdueServices,
      overdueCycles,
      pendingReinforcements: (pendingReinforcementsRaw.rows as Array<Record<string, unknown>>).filter(
        (item) => !filters.branchId || branchIds.has(String(item.branchId)),
      ),
      transfersWithoutProof,
      completedWithoutEvidence,
    };
  }
}
