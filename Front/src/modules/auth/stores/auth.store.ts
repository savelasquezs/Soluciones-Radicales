import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { authService } from '../services/auth.service';
import type { AppUser } from '@/shared/types/common';
import { TOKEN_KEYS } from '@/shared/api/http';

const STORAGE_KEYS = {
  user: 'sr_user',
  preferredMode: 'sr_preferred_mode',
} as const;

type PreferredMode = 'admin' | 'technician';

type AuthError = {
  message: string;
};

const normalizeError = (error: unknown): AuthError => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return { message: String((error as { message: unknown }).message) };
  }

  return { message: 'Ocurrió un error inesperado.' };
};

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AppUser | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem(TOKEN_KEYS.accessToken));
  const refreshToken = ref<string | null>(localStorage.getItem(TOKEN_KEYS.refreshToken));
  const preferredMode = ref<PreferredMode>('admin');
  const isLoading = ref(false);
  const isBootstrapping = ref(false);
  const error = ref<AuthError | null>(null);

  const initialUser = localStorage.getItem(STORAGE_KEYS.user);
  if (initialUser) {
    user.value = JSON.parse(initialUser) as AppUser;
  }

  const initialMode = localStorage.getItem(STORAGE_KEYS.preferredMode);
  if (initialMode === 'admin' || initialMode === 'technician') {
    preferredMode.value = initialMode;
  }

  const isAuthenticated = computed(() => Boolean(accessToken.value));
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isTechnician = computed(() => Boolean(user.value?.isTechnician));

  const resolveHomePath = () => {
    if (!isAuthenticated.value) return '/login';
    if (isAdmin.value && isTechnician.value) {
      return preferredMode.value === 'technician' ? '/technician/schedule' : '/dashboard';
    }
    if (isAdmin.value) return '/dashboard';
    if (isTechnician.value) return '/technician/schedule';
    return '/login';
  };

  const persistUser = (nextUser: AppUser | null) => {
    if (!nextUser) {
      localStorage.removeItem(STORAGE_KEYS.user);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
  };

  const clearSession = () => {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem(TOKEN_KEYS.accessToken);
    localStorage.removeItem(TOKEN_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.preferredMode);
    preferredMode.value = 'admin';
  };

  const setPreferredMode = (mode: PreferredMode) => {
    preferredMode.value = mode;
    localStorage.setItem(STORAGE_KEYS.preferredMode, mode);
  };

  const setSession = (nextUser: AppUser, nextAccessToken: string, nextRefreshToken: string) => {
    user.value = nextUser;
    accessToken.value = nextAccessToken;
    refreshToken.value = nextRefreshToken;
    localStorage.setItem(TOKEN_KEYS.accessToken, nextAccessToken);
    localStorage.setItem(TOKEN_KEYS.refreshToken, nextRefreshToken);
    persistUser(nextUser);

    if (!nextUser.isTechnician) {
      setPreferredMode('admin');
    }
  };

  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await authService.login({ email, password });
      setSession(data.user, data.accessToken, data.refreshToken);
    } catch (err) {
      clearSession();
      error.value = normalizeError(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      if (refreshToken.value) {
        await authService.logout({ refreshToken: refreshToken.value });
      }
    } catch (_err) {
    } finally {
      clearSession();
      isLoading.value = false;
    }
  };

  const refreshSession = async () => {
    if (!refreshToken.value) return;

    try {
      const data = await authService.refresh({ refreshToken: refreshToken.value });
      accessToken.value = data.accessToken;
      refreshToken.value = data.refreshToken;
      localStorage.setItem(TOKEN_KEYS.accessToken, data.accessToken);
      localStorage.setItem(TOKEN_KEYS.refreshToken, data.refreshToken);
    } catch (err) {
      clearSession();
      error.value = normalizeError(err);
      throw error.value;
    }
  };

  const fetchCurrentUser = async () => {
    if (!accessToken.value) return null;

    try {
      const me = await authService.me();
      user.value = me;
      persistUser(me);
      return me;
    } catch (err) {
      error.value = normalizeError(err);
      throw error.value;
    }
  };

  const bootstrapSession = async () => {
    if (!accessToken.value) return;

    isBootstrapping.value = true;
    error.value = null;
    try {
      await fetchCurrentUser();
    } catch (_err) {
      clearSession();
    } finally {
      isBootstrapping.value = false;
    }
  };

  const forgotPassword = async (email: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      return await authService.forgotPassword({ email });
    } catch (err) {
      error.value = normalizeError(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      return await authService.resetPassword({ token, newPassword });
    } catch (err) {
      error.value = normalizeError(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      return await authService.changePassword({ currentPassword, newPassword });
    } catch (err) {
      error.value = normalizeError(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    preferredMode,
    isAuthenticated,
    isAdmin,
    isTechnician,
    isLoading,
    isBootstrapping,
    error,
    login,
    logout,
    refreshSession,
    fetchCurrentUser,
    bootstrapSession,
    forgotPassword,
    resetPassword,
    changePassword,
    setPreferredMode,
    resolveHomePath,
    clearSession,
  };
});
