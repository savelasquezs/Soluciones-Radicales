import { asc, eq } from 'drizzle-orm';
import { SystemSettings } from '../../../domain/entities';
import { SystemSettingsRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toSystemSettingsEntity } from '../mappers';
import { systemSettingsTable } from '../schema';

export class SystemSettingsDrizzleRepository implements SystemSettingsRepository {
  async get(): Promise<SystemSettings | null> {
    const [row] = await drizzleDb
      .select()
      .from(systemSettingsTable)
      .orderBy(asc(systemSettingsTable.createdAt))
      .limit(1);

    return row ? toSystemSettingsEntity(row) : null;
  }

  async update(
    data: Partial<Omit<SystemSettings, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<SystemSettings> {
    const [current] = await drizzleDb
      .select({ id: systemSettingsTable.id })
      .from(systemSettingsTable)
      .orderBy(asc(systemSettingsTable.createdAt))
      .limit(1);

    if (!current) {
      throw new Error('System settings not found');
    }

    const [row] = await drizzleDb
      .update(systemSettingsTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(systemSettingsTable.id, current.id))
      .returning();

    return toSystemSettingsEntity(row);
  }
}

