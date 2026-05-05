import { PasswordResetToken } from '../entities';

export interface PasswordResetTokenRepository {
  create(
    data: Omit<PasswordResetToken, 'id' | 'createdAt' | 'usedAt'>,
  ): Promise<PasswordResetToken>;
  findByHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markAsUsed(tokenHash: string): Promise<void>;
  deleteExpired(now: Date): Promise<void>;
}
