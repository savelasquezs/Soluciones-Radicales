import { Business } from '../entities';

export interface BusinessRepository {
  create(data: Omit<Business, 'id'>): Promise<Business>;
  findByClientId(clientId: string): Promise<Business[]>;
}
