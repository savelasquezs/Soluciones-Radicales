import { ServiceStatus, ServiceType } from '../entities';

export type DashboardMetric =
  | 'sales'
  | 'attributedSales'
  | 'services'
  | 'completedServices'
  | 'pendingServices'
  | 'canceledServices'
  | 'rescheduledServices'
  | 'reinforcements'
  | 'evidences'
  | 'completionRate';

export type DashboardGroupBy = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type DashboardDimension =
  | 'status'
  | 'serviceType'
  | 'paymentMethod'
  | 'technician'
  | 'client'
  | 'business'
  | 'branch'
  | 'paidStatus';

export interface DashboardFilters {
  from?: Date;
  to?: Date;
  technicianId?: string;
  clientId?: string;
  businessId?: string;
  branchId?: string;
  status?: ServiceStatus;
  type?: ServiceType;
  paymentMethodId?: string;
}

export interface DashboardSummary {
  salesTotal: number;
  servicesTotal: number;
  servicesCompleted: number;
  servicesPending: number;
  servicesCanceled: number;
  servicesRescheduled: number;
  overdueServices: number;
  activeClients: number;
  activeBranches: number;
  completionRate: number;
}

export interface DashboardAnalyticsQuery extends DashboardFilters {
  metric: DashboardMetric;
  groupBy?: DashboardGroupBy;
  dimension?: DashboardDimension;
  sort?: DashboardSort;
  limit?: number;
}

export type DashboardSort = 'asc' | 'desc';

export interface DashboardAnalyticsGroupPoint {
  period: string;
  value: number;
}

export interface DashboardAnalyticsDimensionPoint {
  id: string;
  key: string;
  label: string;
  value: number;
}

export interface DashboardAlerts {
  overdueServices: Array<Record<string, unknown>>;
  overdueCycles: Array<Record<string, unknown>>;
  pendingReinforcements: Array<Record<string, unknown>>;
  transfersWithoutProof: Array<Record<string, unknown>>;
  completedWithoutEvidence: Array<Record<string, unknown>>;
}

export interface DashboardRepository {
  getSummary(filters: DashboardFilters): Promise<DashboardSummary>;
  getAnalytics(
    query: DashboardAnalyticsQuery & { sort: 'asc' | 'desc'; limit: number },
  ): Promise<Array<DashboardAnalyticsGroupPoint | DashboardAnalyticsDimensionPoint>>;
  getAlerts(filters: DashboardFilters): Promise<DashboardAlerts>;
}
