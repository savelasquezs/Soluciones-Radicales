import { and, eq, isNull } from 'drizzle-orm';
import { RefreshToken } from '../../../domain/entities';
import { RefreshTokenRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toRefreshTokenEntity } from '../mappers';
import { refreshTokensTable } from '../schema';

export class DrizzleRefreshTokenRepository implements RefreshTokenRepository {
  async create(
    data: Omit<RefreshToken, 'id' | 'createdAt' | 'revokedAt'>,
  ): Promise<RefreshToken> {
    const [row] = await drizzleDb
      .insert(refreshTokensTable)
      .values({
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      })
      .returning();

    return toRefreshTokenEntity(row);
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const [row] = await drizzleDb
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.tokenHash, tokenHash))
      .limit(1);

    return row ? toRefreshTokenEntity(row) : null;
  }

  async revokeByHash(tokenHash: string): Promise<void> {
    await drizzleDb
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokensTable.tokenHash, tokenHash),
          isNull(refreshTokensTable.revokedAt),
        ),
      );
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await drizzleDb
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokensTable.userId, userId),
          isNull(refreshTokensTable.revokedAt),
        ),
      );
  }
}
