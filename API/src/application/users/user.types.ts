import { User, UserRole } from '../../domain/entities';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  isTechnician?: boolean;
  actorUserId?: string | null;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  isTechnician?: boolean;
  actorUserId?: string | null;
}

export type UserPublic = Omit<User, 'password'>;

