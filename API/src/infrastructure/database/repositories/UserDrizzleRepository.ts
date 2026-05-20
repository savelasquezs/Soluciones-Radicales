import { and, desc, eq, isNull } from 'drizzle-orm';
import { User } from '../../../domain/entities';
import { UserRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toUserEntity } from '../mappers';
import { usersTable } from '../schema';

export class UserDrizzleRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const [row] = await drizzleDb
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, id), eq(usersTable.active, true)))
      .limit(1);

    return row ? toUserEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await drizzleDb
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.email, email), eq(usersTable.active, true)))
      .limit(1);

    return row ? toUserEntity(row) : null;
  }

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const [row] = await drizzleDb
      .insert(usersTable)
      .values({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        isTechnician: data.isTechnician,
        active: data.active,
        disabledAt: data.disabledAt,
      })
      .returning();

    return toUserEntity(row);
  }

  async update(
    id: string,
    data: Partial<Omit<User, 'id' | 'createdAt'>>,
  ): Promise<User> {
    const [row] = await drizzleDb
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.id, id))
      .returning();

    if (!row) {
      throw new Error(`User not found: ${id}`);
    }

    return toUserEntity(row);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const [row] = await drizzleDb
      .update(usersTable)
      .set({ password: passwordHash })
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id });

    if (!row) {
      throw new Error(`User not found: ${id}`);
    }
  }

  async listTechnicians(): Promise<User[]> {
    const rows = await drizzleDb
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.isTechnician, true), eq(usersTable.active, true)))
      .orderBy(desc(usersTable.createdAt));

    return rows.map(toUserEntity);
  }

  async listUsers(): Promise<User[]> {
    const rows = await drizzleDb
      .select()
      .from(usersTable)
      .where(eq(usersTable.active, true))
      .orderBy(desc(usersTable.createdAt));

    return rows.map(toUserEntity);
  }

  async disableUser(id: string): Promise<void> {
    const [row] = await drizzleDb
      .update(usersTable)
      .set({
        active: false,
        isTechnician: false,
        disabledAt: new Date(),
      })
      .where(and(eq(usersTable.id, id), isNull(usersTable.disabledAt)))
      .returning({ id: usersTable.id });

    if (!row) {
      throw new Error(`User not found: ${id}`);
    }

  }
}
