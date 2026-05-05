import { SystemSettings } from '../entities';

export interface SystemSettingsRepository {
  get(): Promise<SystemSettings | null>;
  update(
    data: Partial<Omit<SystemSettings, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<SystemSettings>;
}
