import { Service } from '../entities';

export interface ServiceRepository {
  create(data: Omit<Service, 'id' | 'createdAt'>): Promise<Service>;
  findById(id: string): Promise<Service | null>;
  findByBranchId(
    branchId: string,
    filters?: {
      from?: Date;
      to?: Date;
      status?: Service['status'];
      type?: Service['type'];
    },
  ): Promise<Service[]>;
  findByBranchAndScheduledAtAndType(
    branchId: string,
    scheduledAt: Date,
    type: Service['type'],
  ): Promise<Service | null>;
  update(id: string, data: Partial<Omit<Service, 'id' | 'createdAt'>>): Promise<Service>;
  findByScheduledDay(day: Date): Promise<Service[]>;
  findByMonth(year: number, month: number): Promise<Service[]>;
  findByTechnicianId(technicianId: string): Promise<Service[]>;
  isTechnicianAssigned(serviceId: string, technicianId: string): Promise<boolean>;
  assignTechnicians(serviceId: string, technicianIds: string[]): Promise<void>;
  findTechnicianScheduleConflict(
    technicianId: string,
    scheduledAt: Date,
    excludeServiceId?: string,
  ): Promise<Service | null>;
}
