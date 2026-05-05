import { ActivityLog } from '../../../domain/entities';
import { ActivityLogRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toActivityLogEntity } from '../mappers';
import { activityLogsTable } from '../schema';

export class ActivityLogDrizzleRepository implements ActivityLogRepository {
  async create(data: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    const [row] = await drizzleDb
      .insert(activityLogsTable)
      .values({
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
      })
      .returning();

    return toActivityLogEntity(row);
  }
}

