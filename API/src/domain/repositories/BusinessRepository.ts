import { Business } from '../entities';

export interface BusinessRepository {
  create(data: Omit<Business, 'id'>): Promise<Business>;
  findById(id: string): Promise<Business | null>;
  findByClientId(clientId: string): Promise<Business[]>;
  update(id: string, data: Partial<Omit<Business, 'id' | 'clientId'>>): Promise<Business>;
}
