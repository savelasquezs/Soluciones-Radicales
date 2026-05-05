import { and, eq, isNull, lte } from 'drizzle-orm';
import { PasswordResetToken } from '../../../domain/entities';
import { PasswordResetTokenRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toPasswordResetTokenEntity } from '../mappers';
import { passwordResetTokensTable } from '../schema';

export class DrizzlePasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  async create(
    data: Omit<PasswordResetToken, 'id' | 'createdAt' | 'usedAt'>,
  ): Promise<PasswordResetToken> {
    const [row] = await drizzleDb
      .insert(passwordResetTokensTable)
      .values({
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      })
      .returning();

    return toPasswordResetTokenEntity(row);
  }

  async findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const [row] = await drizzleDb
      .select()
      .from(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.tokenHash, tokenHash))
      .limit(1);

    return row ? toPasswordResetTokenEntity(row) : null;
  }

  async markAsUsed(tokenHash: string): Promise<void> {
    await drizzleDb
      .update(passwordResetTokensTable)
      .set({
        usedAt: new Date(),
      })
      .where(eq(passwordResetTokensTable.tokenHash, tokenHash));
  }

  async deleteExpired(now: Date): Promise<void> {
    await drizzleDb
      .delete(passwordResetTokensTable)
      .where(
        and(
          lte(passwordResetTokensTable.expiresAt, now),
          isNull(passwordResetTokensTable.usedAt),
        ),
      );
  }
}
