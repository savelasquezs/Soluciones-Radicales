import { RequestHandler } from 'express';
import type { createClientUseCases } from '../../../application/clients/client.usecases';
import { ValidationError } from '../../../application/errors';
import {
  asyncHandler,
  parseOptionalBoolean,
  parseOptionalDate,
  parseOptionalNumber,
  parseOptionalServiceStatus,
  parseOptionalServiceType,
  parseOptionalString,
  parseOptionalTechnicianRevenueMode,
  parseRequiredString,
} from '../request.utils';

type ClientUseCases = ReturnType<typeof createClientUseCases>;

interface ClientController {
  createInitialClient: RequestHandler;
  listClients: RequestHandler;
  searchClientsByName: RequestHandler;
  getClientById: RequestHandler;
  getClientDetail: RequestHandler;
  updateClient: RequestHandler;
  updateBusiness: RequestHandler;
  updateBranch: RequestHandler;
  updateBranchConfiguration: RequestHandler;
  updateBranchServiceCycle: RequestHandler;
  getBranchHistory: RequestHandler;
  addBusinessToClient: RequestHandler;
  addBranchToBusiness: RequestHandler;
}

export const createClientController = (deps: {
  clientUseCases: Pick<
    ClientUseCases,
    | 'createInitialClient'
    | 'listClients'
    | 'searchClientsByName'
    | 'getClientById'
    | 'getClientDetail'
    | 'updateClient'
    | 'updateBusiness'
    | 'updateBranch'
    | 'updateBranchConfiguration'
    | 'getBranchHistory'
    | 'addBusinessToClient'
    | 'addBranchToBusiness'
  > &
    Partial<Pick<ClientUseCases, 'updateBranchServiceCycle'>>;
}): ClientController => {
  const createInitialClient = asyncHandler(async (request, response) => {
    const data = await deps.clientUseCases.createInitialClient({
      client: {
        name: parseRequiredString(request.body?.client?.name, 'Client name is required'),
        contactName:
          typeof request.body?.client?.contactName === 'string'
            ? request.body.client.contactName
            : undefined,
        phone:
          typeof request.body?.client?.phone === 'string'
            ? request.body.client.phone
            : undefined,
      },
      businessName: parseRequiredString(request.body?.businessName, 'Business name is required'),
      branch: {
        address: parseRequiredString(request.body?.branch?.address, 'Branch address is required'),
        phone:
          typeof request.body?.branch?.phone === 'string'
            ? request.body.branch.phone
            : undefined,
        city:
          typeof request.body?.branch?.city === 'string'
            ? request.body.branch.city
            : undefined,
        pricePerM2: parseOptionalNumber(
          request.body?.branch?.pricePerM2,
          'Branch pricePerM2 must be a number',
        ),
        fixedPrice: parseOptionalNumber(
          request.body?.branch?.fixedPrice,
          'Branch fixedPrice must be a number',
        ),
        frequencyDays: parseOptionalNumber(
          request.body?.branch?.frequencyDays,
          'Branch frequencyDays must be a number',
        ),
        reinforcementDays: parseOptionalNumber(
          request.body?.branch?.reinforcementDays,
          'Branch reinforcementDays must be a number',
        ),
        reinforcementEnabled: parseOptionalBoolean(
          request.body?.branch?.reinforcementEnabled,
          'Branch reinforcementEnabled must be a boolean',
        ),
        reinforcementIsPaid: parseOptionalBoolean(
          request.body?.branch?.reinforcementIsPaid,
          'Branch reinforcementIsPaid must be a boolean',
        ),
      },
      nextMainServiceDate: parseOptionalDate(
        request.body?.nextMainServiceDate,
        'Next main service date is invalid',
      ),
      createService:
        typeof request.body?.createService === 'boolean'
          ? request.body.createService
          : undefined,
    });

    response.status(201).json({ data });
  });

  const listClients = asyncHandler(async (_request, response) => {
    const data = await deps.clientUseCases.listClients();
    response.status(200).json({ data });
  });

  const searchClientsByName = asyncHandler(async (request, response) => {
    const term = parseRequiredString(request.query.q, 'Search term is required');
    const data = await deps.clientUseCases.searchClientsByName(term);
    response.status(200).json({ data });
  });

  const getClientById = asyncHandler(async (request, response) => {
    const data = await deps.clientUseCases.getClientById(
      parseRequiredString(request.params.id, 'Client id is required'),
    );
    response.status(200).json({ data });
  });

  const getClientDetail = asyncHandler(async (request, response) => {
    const data = await deps.clientUseCases.getClientDetail(
      parseRequiredString(request.params.id, 'Client id is required'),
    );
    response.status(200).json({ data });
  });

  const updateClient = asyncHandler(async (request, response) => {
    const data = await deps.clientUseCases.updateClient({
      clientId: parseRequiredString(request.params.id, 'Client id is required'),
      name: parseRequiredString(request.body?.name, 'Client name is required'),
      contactName: parseOptionalString(request.body?.contactName),
      phone: parseOptionalString(request.body?.phone),
    });

    response.status(200).json({ data });
  });

  const updateBusiness = asyncHandler(async (request, response) => {
    const data = await deps.clientUseCases.updateBusiness({
      businessId: parseRequiredString(request.params.businessId, 'Business id is required'),
      name: parseRequiredString(request.body?.name, 'Business name is required'),
    });

    response.status(200).json({ data });
  });

  const updateBranch = asyncHandler(async (request, response) => {
    const data = await deps.clientUseCases.updateBranch({
      branchId: parseRequiredString(request.params.branchId, 'Branch id is required'),
      address: parseRequiredString(request.body?.address, 'Branch address is required'),
      phone: parseOptionalString(request.body?.phone),
      city: parseOptionalString(request.body?.city),
      pricePerM2: parseOptionalNumber(
        request.body?.pricePerM2,
        'Branch pricePerM2 must be a number',
      ),
      fixedPrice: parseOptionalNumber(
        request.body?.fixedPrice,
        'Branch fixedPrice must be a number',
      ),
    });

    response.status(200).json({ data });
  });

  const updateBranchConfiguration = asyncHandler(async (request, response) => {
    const data = await deps.clientUseCases.updateBranchConfiguration({
      branchId: parseRequiredString(request.params.branchId, 'Branch id is required'),
      frequencyDays: parseOptionalNumber(
        request.body?.frequencyDays,
        'Branch frequencyDays must be a number',
      ),
      reinforcementDays: parseOptionalNumber(
        request.body?.reinforcementDays,
        'Branch reinforcementDays must be a number',
      ),
      reinforcementEnabled: parseOptionalBoolean(
        request.body?.reinforcementEnabled,
        'Branch reinforcementEnabled must be a boolean',
      ),
      reinforcementIsPaid: parseOptionalBoolean(
        request.body?.reinforcementIsPaid,
        'Branch reinforcementIsPaid must be a boolean',
      ),
      technicianRevenueMode: parseOptionalTechnicianRevenueMode(
        request.body?.technicianRevenueMode,
      ),
    });

    response.status(200).json({ data });
  });

  const getBranchHistory = asyncHandler(async (request, response) => {
    const data = await deps.clientUseCases.getBranchHistory({
      branchId: parseRequiredString(request.params.branchId, 'Branch id is required'),
      from: parseOptionalDate(request.query.from, 'From query is invalid'),
      to: parseOptionalDate(request.query.to, 'To query is invalid'),
      status: parseOptionalServiceStatus(request.query.status),
      type: parseOptionalServiceType(request.query.type),
    });

    response.status(200).json({ data });
  });

  const updateBranchServiceCycle = asyncHandler(async (request, response) => {
    if (!deps.clientUseCases.updateBranchServiceCycle) {
      throw new Error('updateBranchServiceCycle use case is not configured');
    }

    const nextMainServiceDate = parseOptionalDate(
      request.body?.nextMainServiceDate,
      'Next main service date is invalid',
    );

    if (!nextMainServiceDate) {
      throw new ValidationError('Next main service date is required');
    }

    const data = await deps.clientUseCases.updateBranchServiceCycle({
      branchId: parseRequiredString(request.params.branchId, 'Branch id is required'),
      nextMainServiceDate,
      nextReinforcementDate: parseOptionalDate(
        request.body?.nextReinforcementDate,
        'Next reinforcement date is invalid',
      ),
    });

    response.status(200).json({ data });
  });

  const addBusinessToClient = asyncHandler(async (request, response) => {
    const data = await deps.clientUseCases.addBusinessToClient({
      clientId: parseRequiredString(request.params.clientId, 'Client id is required'),
      name: parseRequiredString(request.body?.name, 'Business name is required'),
    });

    response.status(201).json({ data });
  });

  const addBranchToBusiness = asyncHandler(async (request, response) => {
    const data = await deps.clientUseCases.addBranchToBusiness({
      clientId: parseRequiredString(request.body?.clientId, 'Client id is required'),
      businessId: parseRequiredString(request.params.businessId, 'Business id is required'),
      address: parseRequiredString(request.body?.address, 'Branch address is required'),
      phone: typeof request.body?.phone === 'string' ? request.body.phone : undefined,
      city: typeof request.body?.city === 'string' ? request.body.city : undefined,
      pricePerM2: parseOptionalNumber(
        request.body?.pricePerM2,
        'Branch pricePerM2 must be a number',
      ),
      fixedPrice: parseOptionalNumber(
        request.body?.fixedPrice,
        'Branch fixedPrice must be a number',
      ),
      frequencyDays: parseOptionalNumber(
        request.body?.frequencyDays,
        'Branch frequencyDays must be a number',
      ),
      reinforcementDays: parseOptionalNumber(
        request.body?.reinforcementDays,
        'Branch reinforcementDays must be a number',
      ),
      reinforcementEnabled: parseOptionalBoolean(
        request.body?.reinforcementEnabled,
        'Branch reinforcementEnabled must be a boolean',
      ),
      reinforcementIsPaid: parseOptionalBoolean(
        request.body?.reinforcementIsPaid,
        'Branch reinforcementIsPaid must be a boolean',
      ),
      nextMainServiceDate: parseOptionalDate(
        request.body?.nextMainServiceDate,
        'Next main service date is invalid',
      ),
      createService:
        typeof request.body?.createService === 'boolean'
          ? request.body.createService
          : undefined,
    });

    response.status(201).json({ data });
  });

  return {
    createInitialClient,
    listClients,
    searchClientsByName,
    getClientById,
    getClientDetail,
    updateClient,
    updateBusiness,
    updateBranch,
    updateBranchConfiguration,
    updateBranchServiceCycle,
    getBranchHistory,
    addBusinessToClient,
    addBranchToBusiness,
  };
};
