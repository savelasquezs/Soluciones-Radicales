import {
  BranchRepository,
  BusinessRepository,
  ClientRepository,
  ServiceCycleRepository,
  SystemSettingsRepository,
} from '../../domain/repositories';
import { NotFoundError, ValidationError } from '../errors';
import {
  AddBranchToBusinessInput,
  AddBusinessToClientInput,
  CreateInitialClientInput,
  CreateInitialClientOutput,
} from './client.types';

interface ClientUseCasesDeps {
  clientRepository: ClientRepository;
  businessRepository: BusinessRepository;
  branchRepository: BranchRepository;
  serviceCycleRepository: ServiceCycleRepository;
  systemSettingsRepository: SystemSettingsRepository;
}

export const createClientUseCases = (deps: ClientUseCasesDeps) => {
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

  return {
    createInitialClient,
    getClientById,
    listClients,
    searchClientsByName,
    addBusinessToClient,
    addBranchToBusiness,
  };
};

