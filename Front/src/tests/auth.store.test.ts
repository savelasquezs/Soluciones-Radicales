import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { authService } from '@/modules/auth/services/auth.service';
import { TOKEN_KEYS } from '@/shared/api/http';

vi.mock('@/modules/auth/services/auth.service', () => ({
	authService: {
		login: vi.fn(),
		refresh: vi.fn(),
		logout: vi.fn(),
		me: vi.fn(),
		forgotPassword: vi.fn(),
		resetPassword: vi.fn(),
		changePassword: vi.fn(),
	},
}));

describe('auth.store', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		localStorage.clear();
		vi.clearAllMocks();
	});

	it('login exitoso guarda tokens y usuario y limpia error', async () => {
		const store = useAuthStore();
		store.error = { message: 'prev' };

		vi.mocked(authService.login).mockResolvedValue({
			user: {
				id: 'u1',
				name: 'Admin',
				email: 'a@a.com',
				role: 'admin',
				isTechnician: true,
			},
			accessToken: 'a1',
			refreshToken: 'r1',
		});

		await store.login('a@a.com', '12345678');

		expect(authService.login).toHaveBeenCalled();
		expect(store.accessToken).toBe('a1');
		expect(store.refreshToken).toBe('r1');
		expect(store.user?.id).toBe('u1');
		expect(store.error).toBeNull();
		expect(localStorage.getItem(TOKEN_KEYS.accessToken)).toBe('a1');
		expect(localStorage.getItem(TOKEN_KEYS.refreshToken)).toBe('r1');
		expect(localStorage.getItem('sr_user')).toBe(
			JSON.stringify({
				id: 'u1',
				name: 'Admin',
				email: 'a@a.com',
				role: 'admin',
				isTechnician: true,
			}),
		);
	});

	it('login fallido setea error y no deja sesion autenticada', async () => {
		const store = useAuthStore();
		vi.mocked(authService.login).mockRejectedValue({
			message: 'Credenciales inválidas',
		});

		await expect(store.login('a@a.com', 'bad')).rejects.toEqual({
			message: 'Credenciales inválidas',
		});

		expect(store.error?.message).toBe('Credenciales inválidas');
		expect(store.accessToken).toBeNull();
		expect(store.user).toBeNull();
	});

	it('logout limpia sesion aunque endpoint falle', async () => {
		const store = useAuthStore();
		store.user = {
			id: 'u1',
			name: 'Admin',
			email: 'a@a.com',
			role: 'admin',
			isTechnician: false,
		};
		store.accessToken = 'a1';
		store.refreshToken = 'r1';

		vi.mocked(authService.logout).mockRejectedValue(new Error('network'));

		await store.logout();

		expect(authService.logout).toHaveBeenCalled();
		expect(store.user).toBeNull();
		expect(store.accessToken).toBeNull();
		expect(store.refreshToken).toBeNull();
	});

	it('bootstrapSession con token llama me y carga user', async () => {
		const store = useAuthStore();
		store.accessToken = 'a1';

		vi.mocked(authService.me).mockResolvedValue({
			id: 'u1',
			name: 'Admin',
			email: 'a@a.com',
			role: 'admin',
			isTechnician: false,
		});

		await store.bootstrapSession();

		expect(authService.me).toHaveBeenCalled();
		expect(store.user?.id).toBe('u1');
	});

	it('bootstrapSession sin token no llama me', async () => {
		const store = useAuthStore();

		await store.bootstrapSession();

		expect(authService.me).not.toHaveBeenCalled();
	});

	it('forgotPassword llama servicio y maneja loading/error', async () => {
		const store = useAuthStore();
		vi.mocked(authService.forgotPassword).mockResolvedValue({ success: true });

		await store.forgotPassword('admin@demo.com');

		expect(authService.forgotPassword).toHaveBeenCalledWith({
			email: 'admin@demo.com',
		});
		expect(store.isLoading).toBe(false);

		vi.mocked(authService.forgotPassword).mockRejectedValue({
			message: 'Error',
		});
		await expect(store.forgotPassword('x')).rejects.toEqual({
			message: 'Error',
		});
		expect(store.error?.message).toBe('Error');
	});

	it('resetPassword llama servicio y maneja loading/error', async () => {
		const store = useAuthStore();
		vi.mocked(authService.resetPassword).mockResolvedValue({ success: true });

		await store.resetPassword('t1', '12345678');

		expect(authService.resetPassword).toHaveBeenCalledWith({
			token: 't1',
			newPassword: '12345678',
		});
		expect(store.isLoading).toBe(false);

		vi.mocked(authService.resetPassword).mockRejectedValue({
			message: 'Error',
		});
		await expect(store.resetPassword('t2', '12345678')).rejects.toEqual({
			message: 'Error',
		});
		expect(store.error?.message).toBe('Error');
	});
});
