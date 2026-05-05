import { RequestHandler } from 'express';
import type { createServiceUseCases } from '../../../application/services/service.usecases';
import { ValidationError } from '../../../application/errors';
import {
  asyncHandler,
  parseOptionalDate,
  parseOptionalNumber,
  parseOptionalServiceStatus,
  parseRequiredDate,
  parseRequiredString,
  parseServiceStatus,
  parseServiceType,
  parseStringArray,
} from '../request.utils';

type ServiceUseCases = ReturnType<typeof createServiceUseCases>;

interface ServiceController {
  createService: RequestHandler;
  getServicesByDay: RequestHandler;
  getServicesByMonth: RequestHandler;
  getUpcomingServices: RequestHandler;
  getTechnicianSchedule: RequestHandler;
  getServiceById: RequestHandler;
  updateServiceStatus: RequestHandler;
  rescheduleService: RequestHandler;
  cancelService: RequestHandler;
  assignTechniciansToService: RequestHandler;
}

export const createServiceController = (deps: {
  serviceUseCases: Pick<
    ServiceUseCases,
    | 'createService'
    | 'getServicesByDay'
    | 'getServicesByMonth'
    | 'getUpcomingServices'
    | 'getTechnicianSchedule'
    | 'getServiceById'
    | 'updateServiceStatus'
    | 'rescheduleService'
    | 'cancelService'
    | 'assignTechniciansToService'
  >;
}): ServiceController => {
  const createService = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.createService({
      branchId: parseRequiredString(request.body?.branchId, 'Branch id is required'),
      scheduledAt: parseRequiredDate(request.body?.scheduledAt, 'Scheduled date is invalid'),
      type: parseServiceType(request.body?.type),
      status: parseOptionalServiceStatus(request.body?.status),
      createdBy: typeof request.body?.createdBy === 'string' ? request.body.createdBy : undefined,
      notes: typeof request.body?.notes === 'string' ? request.body.notes : undefined,
      paymentMethodId:
        typeof request.body?.paymentMethodId === 'string'
          ? request.body.paymentMethodId
          : undefined,
      paymentProofUrl:
        typeof request.body?.paymentProofUrl === 'string'
          ? request.body.paymentProofUrl
          : undefined,
      price: parseOptionalNumber(request.body?.price, 'Price must be a number'),
    });

    response.status(201).json({ data });
  });

  const getServicesByDay = asyncHandler(async (request, response) => {
    const date = parseRequiredDate(request.query.date, 'Date query is invalid');
    const data = await deps.serviceUseCases.getServicesByDay(date);
    response.status(200).json({ data });
  });

  const getServicesByMonth = asyncHandler(async (request, response) => {
    const year = parseOptionalNumber(request.query.year, 'Year query must be a number');
    const month = parseOptionalNumber(request.query.month, 'Month query must be a number');

    if (year === undefined) {
      throw new ValidationError('Year query is required');
    }

    if (month === undefined) {
      throw new ValidationError('Month query is required');
    }

    const data = await deps.serviceUseCases.getServicesByMonth(year, month);
    response.status(200).json({ data });
  });

  const getUpcomingServices = asyncHandler(async (request, response) => {
    const days = parseOptionalNumber(request.query.days, 'Days query must be a number');
    const data = await deps.serviceUseCases.getUpcomingServices(days);
    response.status(200).json({ data });
  });

  const getTechnicianSchedule = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.getTechnicianSchedule({
      technicianId: parseRequiredString(
        request.params.technicianId,
        'Technician id is required',
      ),
      from: parseOptionalDate(request.query.from, 'From query is invalid'),
      to: parseOptionalDate(request.query.to, 'To query is invalid'),
    });

    response.status(200).json({ data });
  });

  const getServiceById = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.getServiceById(
      parseRequiredString(request.params.id, 'Service id is required'),
    );
    response.status(200).json({ data });
  });

  const updateServiceStatus = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.updateServiceStatus({
      serviceId: parseRequiredString(request.params.id, 'Service id is required'),
      status: parseServiceStatus(request.body?.status),
      actorUserId:
        typeof request.body?.actorUserId === 'string' ? request.body.actorUserId : undefined,
    });

    response.status(200).json({ data });
  });

  const rescheduleService = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.rescheduleService({
      serviceId: parseRequiredString(request.params.id, 'Service id is required'),
      scheduledAt: parseRequiredDate(request.body?.scheduledAt, 'Scheduled date is invalid'),
      actorUserId:
        typeof request.body?.actorUserId === 'string' ? request.body.actorUserId : undefined,
    });

    response.status(200).json({ data });
  });

  const cancelService = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.cancelService(
      parseRequiredString(request.params.id, 'Service id is required'),
      typeof request.body?.actorUserId === 'string' ? request.body.actorUserId : undefined,
    );

    response.status(200).json({ data });
  });

  const assignTechniciansToService = asyncHandler(async (request, response) => {
    await deps.serviceUseCases.assignTechniciansToService({
      serviceId: parseRequiredString(request.params.id, 'Service id is required'),
      technicianIds: parseStringArray(
        request.body?.technicianIds,
        'Technician ids must be a non-empty string array',
      ),
      actorUserId:
        typeof request.body?.actorUserId === 'string' ? request.body.actorUserId : undefined,
    });

    response.status(200).json({ data: { success: true } });
  });

  return {
    createService,
    getServicesByDay,
    getServicesByMonth,
    getUpcomingServices,
    getTechnicianSchedule,
    getServiceById,
    updateServiceStatus,
    rescheduleService,
    cancelService,
    assignTechniciansToService,
  };
};
