import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { authService } from '../services/auth.service';
import type { AppUser } from '@/shared/types/common';
import { TOKEN_KEYS } from '@/shared/api/http';

const USER_KEY = 'sr_user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AppUser | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem(TOKEN_KEYS.accessToken));
  const refreshToken = ref<string | null>(localStorage.getItem(TOKEN_KEYS.refreshToken));

  const initialUser = localStorage.getItem(USER_KEY);
  if (initialUser) user.value = JSON.parse(initialUser) as AppUser;

  const isAuthenticated = computed(() => Boolean(accessToken.value));
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isTechnician = computed(() => Boolean(user.value?.isTechnician));

  const setSession = (nextUser: AppUser, nextAccessToken: string, nextRefreshToken: string) => {
    user.value = nextUser;
    accessToken.value = nextAccessToken;
    refreshToken.value = nextRefreshToken;
    localStorage.setItem(TOKEN_KEYS.accessToken, nextAccessToken);
    localStorage.setItem(TOKEN_KEYS.refreshToken, nextRefreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const login = async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    setSession(data.user, data.tokens.accessToken, data.tokens.refreshToken);
  };

  const logout = async () => {
    if (refreshToken.value) {
      await authService.logout(refreshToken.value).catch(() => undefined);
    }
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem(TOKEN_KEYS.accessToken);
    localStorage.removeItem(TOKEN_KEYS.refreshToken);
    localStorage.removeItem(USER_KEY);
  };

  const refreshSession = async () => {
    if (!refreshToken.value) return;
    const data = await authService.refresh(refreshToken.value);
    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    localStorage.setItem(TOKEN_KEYS.accessToken, data.accessToken);
    localStorage.setItem(TOKEN_KEYS.refreshToken, data.refreshToken);
  };

  const fetchCurrentUser = async () => {
    if (!accessToken.value) return;
    const me = await authService.me();
    user.value = me;
    localStorage.setItem(USER_KEY, JSON.stringify(me));
  };

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isAdmin,
    isTechnician,
    login,
    logout,
    refreshSession,
    fetchCurrentUser,
  };
});