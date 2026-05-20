import type {
  DateRangeQuery,
  ID,
  PaymentMethodType,
  ServiceStatus,
  ServiceType,
} from '@/shared/types/common';

export type DashboardFilters = DateRangeQuery & {
  technicianId?: ID;
  clientId?: ID;
  businessId?: ID;
  branchId?: ID;
  status?: ServiceStatus;
  type?: ServiceType;
  paymentMethodId?: ID;
};

export type DashboardSummary = {
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
};

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

export type DashboardAnalyticsQuery = DashboardFilters & {
  metric: DashboardMetric;
  groupBy?: DashboardGroupBy;
  dimension?: DashboardDimension;
  sort?: 'asc' | 'desc';
  limit?: number;
};

export type DashboardAnalyticsPeriodItem = {
  period: string;
  value: number;
};

export type DashboardAnalyticsDimensionItem = {
  id: string;
  key: string;
  label: string;
  value: number;
  status?: ServiceStatus;
  serviceType?: ServiceType;
  paymentMethodType?: PaymentMethodType;
};

export type DashboardAnalyticsItem = DashboardAnalyticsPeriodItem | DashboardAnalyticsDimensionItem;

export type DashboardAnalyticsResponse = {
  data: DashboardAnalyticsItem[];
  meta?: {
    metric: DashboardMetric;
    groupBy?: DashboardGroupBy;
    dimension?: DashboardDimension;
    from?: string;
    to?: string;
  };
};

export type DashboardAlertItem = {
  id?: string;
  label?: string;
  message?: string;
  scheduledAt?: string;
  branchId?: string;
  clientName?: string;
  branchName?: string;
  status?: string;
  type?: string;
  [key: string]: unknown;
};

export type DashboardAlerts = {
  overdueServices: DashboardAlertItem[];
  overdueCycles: DashboardAlertItem[];
  pendingReinforcements: DashboardAlertItem[];
  transfersWithoutProof: DashboardAlertItem[];
  completedWithoutEvidence: DashboardAlertItem[];
};
