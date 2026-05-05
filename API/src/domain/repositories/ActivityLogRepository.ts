import { ActivityLog } from '../entities';

export interface ActivityLogRepository {
  create(data: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog>;
}
