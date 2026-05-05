import { Branch } from '../entities';

export interface BranchRepository {
  create(data: Omit<Branch, 'id' | 'createdAt'>): Promise<Branch>;
  findById(id: string): Promise<Branch | null>;
  findByBusinessId(businessId: string): Promise<Branch[]>;
  update(id: string, data: Partial<Omit<Branch, 'id' | 'businessId' | 'createdAt'>>): Promise<Branch>;
  findWithConfiguration(id: string): Promise<Branch | null>;
}
