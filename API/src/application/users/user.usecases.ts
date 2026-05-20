import { hash } from 'bcryptjs';
import { ActivityLogRepository, UserRepository } from '../../domain/repositories';
import { NotFoundError, ValidationError } from '../errors';
import { CreateUserInput, DisableUserInput, UpdateUserInput, UserPublic } from './user.types';

interface UserUseCasesDeps {
  userRepository: UserRepository;
  activityLogRepository?: ActivityLogRepository;
}

const SALT_ROUNDS = 10;

const toPublicUser = (user: {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  isTechnician: boolean;
  active: boolean;
  disabledAt: Date | null;
  createdAt: Date;
}): UserPublic => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isTechnician: user.isTechnician,
  active: user.active,
  disabledAt: user.disabledAt,
  createdAt: user.createdAt,
});

export const createUserUseCases = (deps: UserUseCasesDeps) => {
  const logActivity = async (
    action: string,
    entityId: string,
    userId?: string | null,
  ) => {
    if (!deps.activityLogRepository) {
      return;
    }
    await deps.activityLogRepository.create({
      userId: userId ?? null,
      action,
      entity: 'user',
      entityId,
    });
  };

  const createUser = async (input: CreateUserInput): Promise<UserPublic> => {
    if (!input.name.trim()) {
      throw new ValidationError('Name is required');
    }
    if (!input.email.trim()) {
      throw new ValidationError('Email is required');
    }
    if (!input.password) {
      throw new ValidationError('Password is required');
    }
    if (input.role && input.role !== 'admin') {
      throw new ValidationError('Invalid role');
    }

    const existing = await deps.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ValidationError('Email already exists');
    }

    const passwordHash = await hash(input.password, SALT_ROUNDS);
    const created = await deps.userRepository.create({
      name: input.name,
      email: input.email,
      password: passwordHash,
      role: input.role ?? 'admin',
      isTechnician: input.isTechnician ?? false,
      active: true,
      disabledAt: null,
    });

    await logActivity('user_created', created.id, input.actorUserId ?? null);
    return toPublicUser(created);
  };

  const getUserById = async (id: string): Promise<UserPublic> => {
    const user = await deps.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`User not found: ${id}`);
    }
    return toPublicUser(user);
  };

  const listTechnicians = async (): Promise<UserPublic[]> => {
    const users = await deps.userRepository.listTechnicians();
    return users.map(toPublicUser);
  };

  const listUsers = async (): Promise<UserPublic[]> => {
    const users = await deps.userRepository.listUsers();
    return users.map(toPublicUser);
  };

  const updateUser = async (input: UpdateUserInput): Promise<UserPublic> => {
    const user = await deps.userRepository.findById(input.id);
    if (!user) {
      throw new NotFoundError(`User not found: ${input.id}`);
    }

    const updated = await deps.userRepository.update(input.id, {
      name: input.name,
      email: input.email,
      isTechnician: input.isTechnician,
    });
    await logActivity('user_updated', updated.id, input.actorUserId ?? null);
    return toPublicUser(updated);
  };

  const disableUser = async (input: DisableUserInput): Promise<{ success: true }> => {
    const user = await deps.userRepository.findById(input.id);
    if (!user) {
      throw new NotFoundError(`User not found: ${input.id}`);
    }

    if (input.actorUserId && input.actorUserId === input.id) {
      throw new ValidationError('You cannot disable your own user');
    }

    await deps.userRepository.disableUser(input.id);
    await logActivity('user_disabled', input.id, input.actorUserId ?? null);
    return { success: true };
  };

  return {
    createUser,
    getUserById,
    listUsers,
    listTechnicians,
    updateUser,
    disableUser,
  };
};
