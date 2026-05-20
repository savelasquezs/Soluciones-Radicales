import {
  Branch,
  Business,
  Client,
  Service,
  ServiceCycle,
  ServiceStatus,
  TechnicianRevenueMode,
  ServiceType,
} from '../../domain/entities';

export interface CreateInitialClientInput {
  client: {
    name: string;
    contactName?: string | null;
    phone?: string | null;
  };
  businessName: string;
  branch: {
    address: string;
    phone?: string | null;
    city?: string | null;
    pricePerM2?: number | null;
    fixedPrice?: number | null;
    frequencyDays?: number | null;
    reinforcementDays?: number | null;
    reinforcementEnabled?: boolean | null;
    reinforcementIsPaid?: boolean | null;
  };
  nextMainServiceDate?: Date | null;
  createService?: boolean;
}

export interface CreateInitialClientOutput {
  client: Client;
  business: Business;
  branch: Branch;
  serviceCycle: ServiceCycle | null;
}

export interface AddBusinessToClientInput {
  clientId: string;
  name: string;
}

export interface AddBranchToBusinessInput {
  clientId: string;
  businessId: string;
  address: string;
  phone?: string | null;
  city?: string | null;
  pricePerM2?: number | null;
  fixedPrice?: number | null;
  frequencyDays?: number | null;
  reinforcementDays?: number | null;
  reinforcementEnabled?: boolean | null;
  reinforcementIsPaid?: boolean | null;
  nextMainServiceDate?: Date | null;
  createService?: boolean;
}

export interface GetClientDetailOutput {
  client: Client;
  businesses: Array<{
    business: Business;
    branches: Array<{
      branch: Branch;
      serviceCycle: ServiceCycle | null;
    }>;
  }>;
}

export interface UpdateClientInput {
  clientId: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
}

export interface UpdateBusinessInput {
  businessId: string;
  name: string;
}

export interface UpdateBranchInput {
  branchId: string;
  address: string;
  phone?: string | null;
  city?: string | null;
  pricePerM2?: number | null;
  fixedPrice?: number | null;
}

export interface UpdateBranchConfigurationInput {
  branchId: string;
  frequencyDays?: number | null;
  reinforcementDays?: number | null;
  reinforcementEnabled?: boolean | null;
  reinforcementIsPaid?: boolean | null;
  technicianRevenueMode?: TechnicianRevenueMode;
}

export interface UpdateBranchServiceCycleInput {
  branchId: string;
  nextMainServiceDate: Date;
  nextReinforcementDate?: Date | null;
}

export interface GetBranchHistoryInput {
  branchId: string;
  from?: Date;
  to?: Date;
  status?: ServiceStatus;
  type?: ServiceType;
}

export interface GetBranchHistoryOutput {
  branch: Branch;
  services: Service[];
}
