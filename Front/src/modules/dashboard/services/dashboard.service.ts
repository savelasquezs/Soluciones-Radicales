import { endpoints } from '@/shared/api/endpoints';
import { http } from '@/shared/api/http';
import type {
  DashboardAlerts,
  DashboardAnalyticsQuery,
  DashboardAnalyticsResponse,
  DashboardFilters,
  DashboardSummary,
} from '../types/dashboard.types';

export const dashboardService = {
  getDashboardSummary(filters?: DashboardFilters) {
    return http.get<DashboardSummary>(endpoints.dashboard.summary, {
      params: filters,
    });
  },
  getDashboardAnalytics(query: DashboardAnalyticsQuery) {
    return http.get<DashboardAnalyticsResponse>(endpoints.dashboard.analytics, {
      params: query,
    });
  },
  getDashboardAlerts(filters?: DashboardFilters) {
    return http.get<DashboardAlerts>(endpoints.dashboard.alerts, {
      params: filters,
    });
  },
};
