import { Request, RequestHandler } from 'express';
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
  startService: RequestHandler;
  completeService: RequestHandler;
  generateReinforcementService: RequestHandler;
  addServiceNotes: RequestHandler;
  updateServicePayment: RequestHandler;
  addPaymentProof: RequestHandler;
  addServiceEvidence: RequestHandler;
  listServiceEvidences: RequestHandler;
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
    | 'startService'
    | 'completeService'
    | 'generateReinforcementService'
    | 'addServiceNotes'
    | 'updateServicePayment'
    | 'addPaymentProof'
    | 'addServiceEvidence'
    | 'listServiceEvidences'
  >;
}): ServiceController => {
  const getActor = (request: Request) => ({
    userId: parseRequiredString(request.user?.userId, 'User id is required'),
    role: parseRequiredString(request.user?.role, 'User role is required'),
    isTechnician: Boolean(request.user?.isTechnician),
  });

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

  const startService = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.startService({
      serviceId: parseRequiredString(request.params.id, 'Service id is required'),
      actor: getActor(request),
    });

    response.status(200).json({ data });
  });

  const completeService = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.completeService({
      serviceId: parseRequiredString(request.params.id, 'Service id is required'),
      actor: getActor(request),
    });

    response.status(200).json({ data });
  });

  const addServiceNotes = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.addServiceNotes({
      serviceId: parseRequiredString(request.params.id, 'Service id is required'),
      actor: getActor(request),
      notes: parseRequiredString(request.body?.notes, 'Notes are required'),
    });

    response.status(200).json({ data });
  });

  const generateReinforcementService = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.generateReinforcementService({
      serviceId: parseRequiredString(request.params.id, 'Service id is required'),
      actor: getActor(request),
      price: parseOptionalNumber(request.body?.price, 'Price must be a number'),
    });

    response.status(201).json({ data });
  });

  const updateServicePayment = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.updateServicePayment({
      serviceId: parseRequiredString(request.params.id, 'Service id is required'),
      actor: getActor(request),
      paymentMethodId: parseRequiredString(
        request.body?.paymentMethodId,
        'Payment method id is required',
      ),
    });

    response.status(200).json({ data });
  });

  const addPaymentProof = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.addPaymentProof({
      serviceId: parseRequiredString(request.params.id, 'Service id is required'),
      actor: getActor(request),
      fileName: parseRequiredString(request.body?.fileName, 'File name is required'),
      contentType:
        typeof request.body?.contentType === 'string'
          ? request.body.contentType
          : undefined,
      contentBase64: parseRequiredString(
        request.body?.contentBase64,
        'File content is required',
      ),
    });

    response.status(200).json({ data });
  });

  const addServiceEvidence = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.addServiceEvidence({
      serviceId: parseRequiredString(request.params.id, 'Service id is required'),
      actor: getActor(request),
      fileName: parseRequiredString(request.body?.fileName, 'File name is required'),
      contentType:
        typeof request.body?.contentType === 'string'
          ? request.body.contentType
          : undefined,
      contentBase64: parseRequiredString(
        request.body?.contentBase64,
        'File content is required',
      ),
    });

    response.status(200).json({ data });
  });

  const listServiceEvidences = asyncHandler(async (request, response) => {
    const data = await deps.serviceUseCases.listServiceEvidences({
      serviceId: parseRequiredString(request.params.id, 'Service id is required'),
      actor: getActor(request),
    });

    response.status(200).json({ data });
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
    startService,
    completeService,
    generateReinforcementService,
    addServiceNotes,
    updateServicePayment,
    addPaymentProof,
    addServiceEvidence,
    listServiceEvidences,
  };
};
