import { Service, ServiceCycle, ServiceStatus, ServiceType, User } from '../../domain/entities';

export interface CreateServiceInput {
  branchId: string;
  scheduledAt: Date;
  type: ServiceType;
  status?: ServiceStatus;
  createdBy?: string | null;
  notes?: string | null;
  paymentMethodId?: string | null;
  paymentProofUrl?: string | null;
  price?: number | null;
}

export interface AssignTechniciansInput {
  serviceId: string;
  technicianIds: string[];
  actorUserId?: string | null;
}

export interface UpdateServiceStatusInput {
  serviceId: string;
  status: ServiceStatus;
  actorUserId?: string | null;
}

export interface RescheduleServiceInput {
  serviceId: string;
  scheduledAt: Date;
  actorUserId?: string | null;
}

export interface GetTechnicianScheduleInput {
  technicianId: string;
  from?: Date;
  to?: Date;
}

export interface UpcomingServicesGroup {
  cycle: ServiceCycle;
  branch: {
    id: string;
    businessId: string;
    address: string;
    city: string | null;
  } | null;
}

export interface UpcomingServicesOutput {
  mainServices: UpcomingServicesGroup[];
  reinforcements: UpcomingServicesGroup[];
}

export interface GetTechnicianScheduleOutput {
  technician: Pick<User, 'id' | 'name' | 'email' | 'isTechnician'>;
  services: Service[];
}

