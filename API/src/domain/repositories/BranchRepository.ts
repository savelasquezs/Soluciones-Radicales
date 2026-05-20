import { Branch } from '../entities';

export interface BranchSearchItem {
  branchId: string;
  branchAddress: string;
  branchPhone: string | null;
  businessId: string;
  businessName: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  fixedPrice: number | null;
  pricePerM2: number | null;
  city: string | null;
}

export interface BranchRepository {
  create(data: Omit<Branch, 'id' | 'createdAt'>): Promise<Branch>;
  findById(id: string): Promise<Branch | null>;
  findByBusinessId(businessId: string): Promise<Branch[]>;
  update(id: string, data: Partial<Omit<Branch, 'id' | 'businessId' | 'createdAt'>>): Promise<Branch>;
  findWithConfiguration(id: string): Promise<Branch | null>;
  searchBranchesForService(query: string, limit?: number): Promise<BranchSearchItem[]>;
}
