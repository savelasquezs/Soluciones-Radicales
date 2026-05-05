import { Branch, Business, Client, ServiceCycle } from '../../domain/entities';

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

