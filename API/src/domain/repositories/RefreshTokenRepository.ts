import { RefreshToken } from '../entities';

export interface RefreshTokenRepository {
  create(data: Omit<RefreshToken, 'id' | 'createdAt' | 'revokedAt'>): Promise<RefreshToken>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeByHash(tokenHash: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}
