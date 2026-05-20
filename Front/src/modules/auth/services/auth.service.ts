import { http } from '@/shared/api/http';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type { ApiResponse } from '@/shared/types/api';
import type { AppUser } from '@/shared/types/common';
import type { LoginInput, LoginResponse } from '../types/auth.types';

export const authService = {
  async login(payload: LoginInput) {
    const { data } = await http.post<ApiResponse<LoginResponse>>(API_ENDPOINTS.auth.login, payload);
    return data.data;
  },
  async refresh(refreshToken: string) {
    const { data } = await http.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      API_ENDPOINTS.auth.refresh,
      { refreshToken },
    );
    return data.data;
  },
  async logout(refreshToken: string) {
    await http.post(API_ENDPOINTS.auth.logout, { refreshToken });
  },
  async me() {
    const { data } = await http.get<ApiResponse<AppUser>>(API_ENDPOINTS.auth.me);
    return data.data;
  },
  async changePassword(currentPassword: string, newPassword: string) {
    await http.patch(API_ENDPOINTS.auth.changePassword, { currentPassword, newPassword });
  },
  async forgotPassword(email: string) {
    await http.post(API_ENDPOINTS.auth.forgotPassword, { email });
  },
  async resetPassword(token: string, newPassword: string) {
    await http.post(API_ENDPOINTS.auth.resetPassword, { token, newPassword });
  },
};