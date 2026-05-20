import { RequestHandler } from 'express';
import type { createDashboardUseCases } from '../../../application/dashboard/dashboard.usecases';
import { ValidationError } from '../../../application/errors';
import {
  asyncHandler,
  parseOptionalDate,
  parseOptionalNumber,
  parseOptionalServiceStatus,
  parseOptionalServiceType,
  parseOptionalString,
} from '../request.utils';

type DashboardUseCases = ReturnType<typeof createDashboardUseCases>;

const metrics = new Set([
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
const groupBys = new Set(['day', 'week', 'month', 'quarter', 'year']);
const dimensions = new Set([
  'status',
  'serviceType',
  'paymentMethod',
  'technician',
  'client',
  'business',
  'branch',
  'paidStatus',
]);
const sorts = new Set(['asc', 'desc']);

export const createDashboardController = (deps: {
  dashboardUseCases: Pick<DashboardUseCases, 'getSummary' | 'getAnalytics' | 'getAlerts'>;
}): Record<string, RequestHandler> => {
  const parseFilters = (query: Record<string, unknown>) => ({
    from: parseOptionalDate(query.from, 'From query is invalid'),
    to: parseOptionalDate(query.to, 'To query is invalid'),
    technicianId: parseOptionalString(query.technicianId),
    clientId: parseOptionalString(query.clientId),
    businessId: parseOptionalString(query.businessId),
    branchId: parseOptionalString(query.branchId),
    status: parseOptionalServiceStatus(query.status),
    type: parseOptionalServiceType(query.type),
    paymentMethodId: parseOptionalString(query.paymentMethodId),
  });
  const parseAlertFilters = (query: Record<string, unknown>) => ({
    from: parseOptionalDate(query.from, 'From query is invalid'),
    to: parseOptionalDate(query.to, 'To query is invalid'),
    technicianId: parseOptionalString(query.technicianId),
    clientId: parseOptionalString(query.clientId),
    businessId: parseOptionalString(query.businessId),
    branchId: parseOptionalString(query.branchId),
  });

  const getSummary = asyncHandler(async (request, response) => {
    const data = await deps.dashboardUseCases.getSummary(
      parseFilters(request.query as Record<string, unknown>),
    );
    response.status(200).json({ data });
  });

  const getAnalytics = asyncHandler(async (request, response) => {
    const metric = parseOptionalString(request.query.metric);
    if (!metric || !metrics.has(metric)) {
      throw new ValidationError('Metric query is required');
    }

    const groupBy = parseOptionalString(request.query.groupBy);
    if (groupBy && !groupBys.has(groupBy)) {
      throw new ValidationError('Invalid groupBy');
    }

    const dimension = parseOptionalString(request.query.dimension);
    if (dimension && !dimensions.has(dimension)) {
      throw new ValidationError('Invalid dimension');
    }

    const sort = parseOptionalString(request.query.sort);
    if (sort && !sorts.has(sort)) {
      throw new ValidationError('Invalid sort');
    }

    const data = await deps.dashboardUseCases.getAnalytics({
      ...parseFilters(request.query as Record<string, unknown>),
      metric: metric as never,
      groupBy: groupBy as never,
      dimension: dimension as never,
      sort: sort as never,
      limit: parseOptionalNumber(request.query.limit, 'Limit query must be a number'),
    });

    response.status(200).json(data);
  });

  const getAlerts = asyncHandler(async (request, response) => {
    const data = await deps.dashboardUseCases.getAlerts(
      parseAlertFilters(request.query as Record<string, unknown>),
    );
    response.status(200).json({ data });
  });

  return {
    getSummary,
    getAnalytics,
    getAlerts,
  };
};
