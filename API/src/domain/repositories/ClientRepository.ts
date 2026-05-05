import { Client } from '../entities';

export interface ClientRepository {
  create(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client>;
  findById(id: string): Promise<Client | null>;
  list(): Promise<Client[]>;
  searchByName(name: string): Promise<Client[]>;
}
