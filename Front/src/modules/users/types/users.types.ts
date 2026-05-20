import type { AppUser, ID } from '@/shared/types/common';

export type User = AppUser;

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: 'admin';
  isTechnician: boolean;
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  isTechnician?: boolean;
};

export type UserId = ID;
