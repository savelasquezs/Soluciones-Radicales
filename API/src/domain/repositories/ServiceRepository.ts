import { Service } from '../entities';

export interface ServiceRepository {
  create(data: Omit<Service, 'id' | 'createdAt'>): Promise<Service>;
  findById(id: string): Promise<Service | null>;
  update(id: string, data: Partial<Omit<Service, 'id' | 'createdAt'>>): Promise<Service>;
  findByScheduledDay(day: Date): Promise<Service[]>;
  findByMonth(year: number, month: number): Promise<Service[]>;
  findByTechnicianId(technicianId: string): Promise<Service[]>;
  assignTechnicians(serviceId: string, technicianIds: string[]): Promise<void>;
  findTechnicianScheduleConflict(
    technicianId: string,
    scheduledAt: Date,
    excludeServiceId?: string,
  ): Promise<Service | null>;
}
