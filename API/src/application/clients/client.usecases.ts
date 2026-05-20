import {
  BranchRepository,
  BusinessRepository,
  ClientRepository,
  ServiceRepository,
  ServiceCycleRepository,
  SystemSettingsRepository,
} from '../../domain/repositories';
import { NotFoundError, ValidationError } from '../errors';
import {
  AddBranchToBusinessInput,
  AddBusinessToClientInput,
  CreateInitialClientInput,
  CreateInitialClientOutput,
  GetBranchHistoryInput,
  GetClientDetailOutput,
  UpdateBranchConfigurationInput,
  UpdateBranchInput,
  UpdateBusinessInput,
  UpdateClientInput,
} from './client.types';

interface ClientUseCasesDeps {
  clientRepository: ClientRepository;
  businessRepository: BusinessRepository;
  branchRepository: BranchRepository;
  serviceRepository: ServiceRepository;
  serviceCycleRepository: ServiceCycleRepository;
  systemSettingsRepository: SystemSettingsRepository;
}

export const createClientUseCases = (deps: ClientUseCasesDeps) => {
  const technicianRevenueModes = new Set(['split', 'full']);

  const resolveBranchConfig = async (input: {
    frequencyDays?: number | null;
    reinforcementDays?: number | null;
    reinforcementEnabled?: boolean | null;
    reinforcementIsPaid?: boolean | null;
  }) => {
    const settings = await deps.systemSettingsRepository.get();

    if (!settings) {
      throw new NotFoundError('System settings not found');
    }

    return {
      frequencyDays: input.frequencyDays ?? settings.defaultFrequencyDays,
      reinforcementDays: input.reinforcementDays ?? settings.defaultReinforcementDays,
      reinforcementEnabled:
        input.reinforcementEnabled ?? settings.reinforcementEnabledDefault,
      reinforcementIsPaid:
        input.reinforcementIsPaid ?? settings.reinforcementIsPaidDefault,
    };
  };

  const createInitialClient = async (
    input: CreateInitialClientInput,
  ): Promise<CreateInitialClientOutput> => {
    if (!input.client.name.trim()) {
      throw new ValidationError('Client name is required');
    }
    if (!input.businessName.trim()) {
      throw new ValidationError('Business name is required');
    }
    if (!input.branch.address.trim()) {
      throw new ValidationError('Branch address is required');
    }

    const client = await deps.clientRepository.create({
      name: input.client.name,
      contactName: input.client.contactName ?? null,
      phone: input.client.phone ?? null,
    });

    const business = await deps.businessRepository.create({
      clientId: client.id,
      name: input.businessName,
    });

    const config = await resolveBranchConfig(input.branch);
    const branch = await deps.branchRepository.create({
      businessId: business.id,
      address: input.branch.address,
      phone: input.branch.phone ?? null,
      city: input.branch.city ?? null,
      pricePerM2: input.branch.pricePerM2 ?? null,
      fixedPrice: input.branch.fixedPrice ?? null,
      frequencyDays: config.frequencyDays,
      reinforcementDays: config.reinforcementDays,
      reinforcementEnabled: config.reinforcementEnabled,
      reinforcementIsPaid: config.reinforcementIsPaid,
      technicianRevenueMode: 'split',
    });

    let serviceCycle = null;
    if (input.nextMainServiceDate) {
      serviceCycle = await deps.serviceCycleRepository.create({
        branchId: branch.id,
        lastServiceDate: null,
        nextMainServiceDate: input.nextMainServiceDate,
        nextReinforcementDate: null,
        active: true,
      });
    }

    return {
      client,
      business,
      branch,
      serviceCycle,
    };
  };

  const getClientById = async (id: string) => {
    const client = await deps.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundError(`Client not found: ${id}`);
    }
    return client;
  };

  const listClients = async () => deps.clientRepository.list();

  const searchClientsByName = async (term: string) => {
    if (!term.trim()) {
      throw new ValidationError('Search term is required');
    }
    return deps.clientRepository.searchByName(term);
  };

  const addBusinessToClient = async (input: AddBusinessToClientInput) => {
    if (!input.name.trim()) {
      throw new ValidationError('Business name is required');
    }

    const client = await deps.clientRepository.findById(input.clientId);
    if (!client) {
      throw new NotFoundError(`Client not found: ${input.clientId}`);
    }

    return deps.businessRepository.create({
      clientId: input.clientId,
      name: input.name,
    });
  };

  const addBranchToBusiness = async (input: AddBranchToBusinessInput) => {
    if (!input.address.trim()) {
      throw new ValidationError('Branch address is required');
    }

    const businesses = await deps.businessRepository.findByClientId(input.clientId);
    const business = businesses.find((item) => item.id === input.businessId);
    if (!business) {
      throw new NotFoundError(`Business not found: ${input.businessId}`);
    }

    const config = await resolveBranchConfig(input);
    const branch = await deps.branchRepository.create({
      businessId: input.businessId,
      address: input.address,
      phone: input.phone ?? null,
      city: input.city ?? null,
      pricePerM2: input.pricePerM2 ?? null,
      fixedPrice: input.fixedPrice ?? null,
      frequencyDays: config.frequencyDays,
      reinforcementDays: config.reinforcementDays,
      reinforcementEnabled: config.reinforcementEnabled,
      reinforcementIsPaid: config.reinforcementIsPaid,
      technicianRevenueMode: 'split',
    });

    let serviceCycle = null;
    if (input.nextMainServiceDate) {
      serviceCycle = await deps.serviceCycleRepository.create({
        branchId: branch.id,
        lastServiceDate: null,
        nextMainServiceDate: input.nextMainServiceDate,
        nextReinforcementDate: null,
        active: true,
      });
    }

    return { branch, serviceCycle };
  };

  const getClientDetail = async (clientId: string): Promise<GetClientDetailOutput> => {
    const client = await deps.clientRepository.findById(clientId);
    if (!client) {
      throw new NotFoundError(`Client not found: ${clientId}`);
    }

    const businesses = await deps.businessRepository.findByClientId(clientId);
    const businessDetails = await Promise.all(
      businesses.map(async (business) => {
        const branches = await deps.branchRepository.findByBusinessId(business.id);
        const branchDetails = await Promise.all(
          branches.map(async (branch) => ({
            branch,
            serviceCycle: await deps.serviceCycleRepository.findByBranchId(branch.id),
          })),
        );

        return {
          business,
          branches: branchDetails,
        };
      }),
    );

    return {
      client,
      businesses: businessDetails,
    };
  };

  const updateClient = async (input: UpdateClientInput) => {
    if (!input.name.trim()) {
      throw new ValidationError('Client name is required');
    }

    const client = await deps.clientRepository.findById(input.clientId);
    if (!client) {
      throw new NotFoundError(`Client not found: ${input.clientId}`);
    }

    return deps.clientRepository.update(input.clientId, {
      name: input.name,
      contactName: input.contactName === undefined ? client.contactName : input.contactName,
      phone: input.phone === undefined ? client.phone : input.phone,
    });
  };

  const updateBusiness = async (input: UpdateBusinessInput) => {
    if (!input.name.trim()) {
      throw new ValidationError('Business name is required');
    }

    const business = await deps.businessRepository.findById(input.businessId);
    if (!business) {
      throw new NotFoundError(`Business not found: ${input.businessId}`);
    }

    return deps.businessRepository.update(input.businessId, {
      name: input.name,
    });
  };

  const updateBranch = async (input: UpdateBranchInput) => {
    if (!input.address.trim()) {
      throw new ValidationError('Branch address is required');
    }

    const branch = await deps.branchRepository.findById(input.branchId);
    if (!branch) {
      throw new NotFoundError(`Branch not found: ${input.branchId}`);
    }

    return deps.branchRepository.update(input.branchId, {
      address: input.address,
      phone: input.phone === undefined ? branch.phone : input.phone,
      city: input.city === undefined ? branch.city : input.city,
      pricePerM2: input.pricePerM2 === undefined ? branch.pricePerM2 : input.pricePerM2,
      fixedPrice: input.fixedPrice === undefined ? branch.fixedPrice : input.fixedPrice,
    });
  };

  const updateBranchConfiguration = async (input: UpdateBranchConfigurationInput) => {
    const branch = await deps.branchRepository.findById(input.branchId);
    if (!branch) {
      throw new NotFoundError(`Branch not found: ${input.branchId}`);
    }
    if (
      input.technicianRevenueMode !== undefined &&
      !technicianRevenueModes.has(input.technicianRevenueMode)
    ) {
      throw new ValidationError('Invalid technician revenue mode');
    }

    return deps.branchRepository.update(input.branchId, {
      frequencyDays:
        input.frequencyDays === undefined ? branch.frequencyDays : input.frequencyDays,
      reinforcementDays:
        input.reinforcementDays === undefined
          ? branch.reinforcementDays
          : input.reinforcementDays,
      reinforcementEnabled:
        input.reinforcementEnabled === undefined
          ? branch.reinforcementEnabled
          : input.reinforcementEnabled,
      reinforcementIsPaid:
        input.reinforcementIsPaid === undefined
          ? branch.reinforcementIsPaid
          : input.reinforcementIsPaid,
      technicianRevenueMode:
        input.technicianRevenueMode === undefined
          ? branch.technicianRevenueMode
          : input.technicianRevenueMode,
    });
  };

  const getBranchHistory = async (input: GetBranchHistoryInput) => {
    const branch = await deps.branchRepository.findById(input.branchId);
    if (!branch) {
      throw new NotFoundError(`Branch not found: ${input.branchId}`);
    }

    const services = await deps.serviceRepository.findByBranchId(input.branchId, {
      from: input.from,
      to: input.to,
      status: input.status,
      type: input.type,
    });

    return {
      branch,
      services,
    };
  };

  return {
    createInitialClient,
    getClientById,
    listClients,
    searchClientsByName,
    addBusinessToClient,
    addBranchToBusiness,
    getClientDetail,
    updateClient,
    updateBusiness,
    updateBranch,
    updateBranchConfiguration,
    getBranchHistory,
  };
};
