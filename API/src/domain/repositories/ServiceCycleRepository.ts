import { ServiceCycle } from '../entities';

export interface ServiceCycleRepository {
  create(data: Omit<ServiceCycle, 'id'>): Promise<ServiceCycle>;
  findByBranchId(branchId: string): Promise<ServiceCycle | null>;
  update(
    branchId: string,
    data: Partial<Omit<ServiceCycle, 'id' | 'branchId'>>,
  ): Promise<ServiceCycle>;
  findUpcomingMainServices(from: Date, to: Date): Promise<ServiceCycle[]>;
  findUpcomingReinforcements(from: Date, to: Date): Promise<ServiceCycle[]>;
}
