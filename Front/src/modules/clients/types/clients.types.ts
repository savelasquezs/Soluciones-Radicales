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
  contactName: string | null;
  phone: string | null;
  createdAt?: ISODateString;
};

export type Business = {
  id: ID;
  clientId: ID;
  name: string;
};

export type Branch = {
  id: ID;
  businessId: ID;
  address: string;
  phone: string | null;
  city: string | null;
  pricePerM2: number | null;
  fixedPrice: number | null;
  frequencyDays: number | null;
  reinforcementDays: number | null;
  reinforcementEnabled: boolean | null;
  reinforcementIsPaid: boolean | null;
  technicianRevenueMode: TechnicianRevenueMode;
  createdAt: ISODateString;
};

export type BranchConfiguration = {
  id: ID;
  frequencyDays: number | null;
  reinforcementDays: number | null;
  reinforcementEnabled: boolean | null;
  reinforcementIsPaid: boolean | null;
  technicianRevenueMode: TechnicianRevenueMode;
};

export type ServiceCycle = {
  id: ID;
  branchId: ID;
  active: boolean;
  lastMainServiceDate: ISODateString | null;
  nextMainServiceDate: ISODateString | null;
  nextReinforcementDate: ISODateString | null;
};

export type ClientBranchDetail = {
  branch: Branch;
  serviceCycle: ServiceCycle | null;
};

export type ClientBusinessDetail = {
  business: Business;
  branches: ClientBranchDetail[];
};

export type ClientDetail = {
  client: Client;
  businesses: ClientBusinessDetail[];
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
  };
  nextMainServiceDate?: ISODateString;
  createService?: boolean;
};

export type CreateInitialClientResult = {
  client: Client;
  business: Business;
  branch: Branch;
  serviceCycle: ServiceCycle | null;
};

export type UpdateClientPayload = {
  name: string;
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
  frequencyDays?: number;
  reinforcementDays?: number;
  reinforcementEnabled?: boolean;
  reinforcementIsPaid?: boolean;
  nextMainServiceDate?: ISODateString;
  createService?: boolean;
};

export type AddBranchResult = {
  branch: Branch;
  serviceCycle: ServiceCycle | null;
};

export type UpdateBranchPayload = {
  address: string;
  city?: string;
  phone?: string;
  pricePerM2?: number;
  fixedPrice?: number;
};

export type UpdateBranchConfigurationPayload = {
  frequencyDays: number;
  reinforcementDays: number;
  reinforcementEnabled: boolean;
  reinforcementIsPaid: boolean;
  technicianRevenueMode: TechnicianRevenueMode;
};

export type BranchHistoryQuery = DateRangeQuery & {
  status?: ServiceStatus;
  type?: ServiceType;
};

export type BranchHistoryServiceItem = {
  id: ID;
  branchId: ID;
  status: ServiceStatus;
  type: ServiceType;
  scheduledAt: ISODateString | null;
  price: number | null;
  notes: string | null;
  paymentMethodId: string | null;
  paymentProofUrl: string | null;
  createdBy: string | null;
  createdAt: ISODateString;
};

export type BranchHistoryResponse = {
  branch: Branch;
  services: BranchHistoryServiceItem[];
};
