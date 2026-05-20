import { http } from '@/shared/api/http';
import { endpoints } from '@/shared/api/endpoints';
import type { AppUser } from '@/shared/types/common';
import type {
	ChangePasswordPayload,
	ForgotPasswordPayload,
	ForgotPasswordResponse,
	LoginPayload,
	LoginResponse,
	BackendLoginResponse,
	RefreshPayload,
	RefreshResponse,
	ResetPasswordPayload,
	ResetPasswordResponse,
} from '../types/auth.types';

export const authService = {
	async login(payload: LoginPayload) {
		const resp = await http.post<BackendLoginResponse>(
			endpoints.auth.login,
			payload,
		);

		if (
			!resp ||
			!resp.user ||
			!resp.tokens ||
			!resp.tokens.accessToken ||
			!resp.tokens.refreshToken
		) {
			throw new Error('Invalid login response');
		}

		const normalized: LoginResponse = {
			user: resp.user,
			accessToken: resp.tokens.accessToken,
			refreshToken: resp.tokens.refreshToken,
		};

		return normalized;
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
		return http.patch<{ success: boolean }>(
			endpoints.auth.changePassword,
			payload,
		);
	},
	forgotPassword(payload: ForgotPasswordPayload) {
		return http.post<ForgotPasswordResponse>(
			endpoints.auth.forgotPassword,
			payload,
		);
	},
	resetPassword(payload: ResetPasswordPayload) {
		return http.post<ResetPasswordResponse>(
			endpoints.auth.resetPassword,
			payload,
		);
	},
};
