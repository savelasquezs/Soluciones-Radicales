import type {
  DateRangeQuery,
  ID,
  ISODateString,
  ServiceStatus,
  ServiceType,
  TechnicianRevenueMode,
} from '@/shared/types/common';

export type Client = {
  id: ID;
  name: string;
  contactName?: string | null;
  phone?: string | null;
};

export type Business = {
  id: ID;
  clientId: ID;
  name: string;
  branches?: Branch[];
};

export type Branch = {
  id: ID;
  businessId?: ID;
  clientId?: ID;
  address: string;
  city?: string | null;
  phone?: string | null;
  pricePerM2?: number | null;
  fixedPrice?: number | null;
};

export type BranchConfiguration = {
  frequencyDays?: number;
  reinforcementDays?: number;
  reinforcementEnabled?: boolean;
  reinforcementIsPaid?: boolean;
  technicianRevenueMode?: TechnicianRevenueMode;
};

export type ServiceCycle = {
  id?: ID;
  branchId?: ID;
  active?: boolean;
  lastMainServiceDate?: ISODateString | null;
  nextMainServiceDate?: ISODateString | null;
  nextReinforcementDate?: ISODateString | null;
};

export type ClientDetail = {
  client: Client;
  businesses: Array<
    Business & {
      branches: Array<
        Branch & {
          configuration?: BranchConfiguration;
          serviceCycle?: ServiceCycle;
        }
      >;
    }
  >;
};

export type CreateInitialClientPayload = {
  client: Pick<Client, 'name' | 'contactName' | 'phone'>;
  businessName: string;
  branch: {
    address: string;
    city?: string;
    phone?: string;
    pricePerM2?: number;
    fixedPrice?: number;
    frequencyDays?: number;
    reinforcementDays?: number;
    reinforcementEnabled?: boolean;
    reinforcementIsPaid?: boolean;
    technicianRevenueMode?: TechnicianRevenueMode;
  };
  nextMainServiceDate?: ISODateString;
  createService?: boolean;
};

export type UpdateClientPayload = {
  name?: string;
  contactName?: string;
  phone?: string;
};

export type AddBusinessPayload = {
  name: string;
};

export type UpdateBusinessPayload = {
  name: string;
};

export type AddBranchPayload = {
  clientId: ID;
  address: string;
  city?: string;
  phone?: string;
  pricePerM2?: number;
  fixedPrice?: number;
};

export type UpdateBranchPayload = {
  address?: string;
  city?: string;
  phone?: string;
  pricePerM2?: number;
  fixedPrice?: number;
};

export type UpdateBranchConfigurationPayload = BranchConfiguration;

export type BranchHistoryQuery = DateRangeQuery & {
  status?: ServiceStatus;
  type?: ServiceType;
};

export type BranchHistoryServiceItem = {
  id: ID;
  status: ServiceStatus;
  type: ServiceType;
  scheduledAt?: ISODateString;
};

export type BranchHistoryResponse = {
  branch: Branch;
  services: BranchHistoryServiceItem[];
};
