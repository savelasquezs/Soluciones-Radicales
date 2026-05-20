import type { AppUser } from '@/shared/types/common';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: AppUser;
  tokens: AuthTokens;
}