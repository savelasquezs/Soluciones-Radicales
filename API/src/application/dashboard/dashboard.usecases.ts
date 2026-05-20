import { ValidationError } from '../errors';
import { DashboardRepository } from '../../domain/repositories';
import {
  DashboardAnalyticsQuery,
  DashboardDimension,
  DashboardFilters,
  DashboardGroupBy,
  DashboardMetric,
  DashboardSort,
} from './dashboard.types';

interface DashboardUseCasesDeps {
  dashboardRepository: DashboardRepository;
}

const metrics = new Set<DashboardMetric>([
  'sales',
  'attributedSales',
  'services',
  'completedServices',
  'pendingServices',
  'canceledServices',
  'rescheduledServices',
  'reinforcements',
  'evidences',
  'completionRate',
]);

const groupBys = new Set<DashboardGroupBy>(['day', 'week', 'month', 'quarter', 'year']);
const dimensions = new Set<DashboardDimension>([
  'status',
  'serviceType',
  'paymentMethod',
  'technician',
  'client',
  'business',
  'branch',
  'paidStatus',
]);
const sorts = new Set<DashboardSort>(['asc', 'desc']);
const completionRateAllowedDimensions = new Set<DashboardDimension>([
  'technician',
  'client',
  'business',
  'branch',
]);

export const createDashboardUseCases = (deps: DashboardUseCasesDeps) => {
  const getSummary = async (filters: DashboardFilters) => deps.dashboardRepository.getSummary(filters);

  const getAnalytics = async (query: DashboardAnalyticsQuery) => {
    if (!query.metric || !metrics.has(query.metric)) {
      throw new ValidationError('Metric query is required');
    }

    if (query.groupBy && !groupBys.has(query.groupBy)) {
      throw new ValidationError('Invalid groupBy');
    }

    if (query.dimension && !dimensions.has(query.dimension)) {
      throw new ValidationError('Invalid dimension');
    }

    if (query.groupBy && query.dimension) {
      throw new ValidationError('groupBy and dimension cannot be used together');
    }

    if (
      query.metric === 'completionRate' &&
      query.dimension &&
      !completionRateAllowedDimensions.has(query.dimension)
    ) {
      throw new ValidationError(
        'completionRate only allows dimension=technician|client|business|branch',
      );
    }

    if (
      query.metric === 'attributedSales' &&
      !query.technicianId &&
      query.dimension !== 'technician'
    ) {
      throw new ValidationError(
        'attributedSales requires dimension=technician or technicianId',
      );
    }

    const limit = query.limit === undefined ? 20 : query.limit;
    if (limit <= 0) {
      throw new ValidationError('Limit must be greater than 0');
    }
    const normalizedLimit = Math.min(limit, 50);

    const sort = query.sort ?? 'desc';
    if (!sorts.has(sort)) {
      throw new ValidationError('Invalid sort');
    }

    const data = await deps.dashboardRepository.getAnalytics({
      ...query,
      sort,
      limit: normalizedLimit,
    });

    if (query.groupBy) {
      return {
        data,
        meta: {
          metric: query.metric,
          groupBy: query.groupBy,
          from: query.from?.toISOString(),
          to: query.to?.toISOString(),
        },
      };
    }

    if (query.dimension) {
      return {
        data,
        meta: {
          metric: query.metric,
          dimension: query.dimension,
        },
      };
    }

    return {
      data,
      meta: {
        metric: query.metric,
      },
    };
  };

  const getAlerts = async (filters: DashboardFilters) => deps.dashboardRepository.getAlerts(filters);

  return {
    getSummary,
    getAnalytics,
    getAlerts,
  };
};
