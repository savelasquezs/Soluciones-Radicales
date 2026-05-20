import { http } from '@/shared/api/http';
import { endpoints } from '@/shared/api/endpoints';
import type { AppUser } from '@/shared/types/common';
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  LoginResponse,
  RefreshPayload,
  RefreshResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from '../types/auth.types';

export const authService = {
  login(payload: LoginPayload) {
    return http.post<LoginResponse>(endpoints.auth.login, payload);
  },
  refresh(payload: RefreshPayload) {
    return http.post<RefreshResponse>(endpoints.auth.refresh, payload);
  },
  logout(payload: RefreshPayload) {
    return http.post<{ success: boolean }>(endpoints.auth.logout, payload);
  },
  me() {
    return http.get<AppUser>(endpoints.auth.me);
  },
  changePassword(payload: ChangePasswordPayload) {
    return http.patch<{ success: boolean }>(endpoints.auth.changePassword, payload);
  },
  forgotPassword(payload: ForgotPasswordPayload) {
    return http.post<ForgotPasswordResponse>(endpoints.auth.forgotPassword, payload);
  },
  resetPassword(payload: ResetPasswordPayload) {
    return http.post<ResetPasswordResponse>(endpoints.auth.resetPassword, payload);
  },
};
