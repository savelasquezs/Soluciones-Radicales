import { ServiceEvidence } from '../entities';

export interface ServiceEvidenceRepository {
  create(data: Omit<ServiceEvidence, 'id' | 'createdAt'>): Promise<ServiceEvidence>;
  listByServiceId(serviceId: string): Promise<ServiceEvidence[]>;
}
