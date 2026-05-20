import axios, { type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/shared/types/api';

export const TOKEN_KEYS = {
  accessToken: 'sr_access_token',
  refreshToken: 'sr_refresh_token',
} as const;

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const flushQueue = (token: string | null) => {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
};

const normalizeError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return {
      message: (error.response?.data as { message?: string } | undefined)?.message ??
        error.message ??
        'Request failed',
    };
  }

  return { message: 'Request failed' };
};

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEYS.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const refreshToken = localStorage.getItem(TOKEN_KEYS.refreshToken);

    if (status !== 401 || original?._retry || !refreshToken) {
      return Promise.reject(normalizeError(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) {
            reject({ message: 'Session expired' });
            return;
          }

          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${token}`;
          resolve(httpClient(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        { refreshToken },
      );

      const newAccessToken = response.data?.data?.accessToken;
      const newRefreshToken = response.data?.data?.refreshToken;

      if (!newAccessToken || !newRefreshToken) {
        throw new Error('Invalid refresh response');
      }

      localStorage.setItem(TOKEN_KEYS.accessToken, newAccessToken);
      localStorage.setItem(TOKEN_KEYS.refreshToken, newRefreshToken);
      flushQueue(newAccessToken);

      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return httpClient(original);
    } catch (_refreshError) {
      localStorage.removeItem(TOKEN_KEYS.accessToken);
      localStorage.removeItem(TOKEN_KEYS.refreshToken);
      flushQueue(null);

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      return Promise.reject({ message: 'Session expired' });
    } finally {
      isRefreshing = false;
    }
  },
);

const unwrap = <T>(response: { data: ApiResponse<T> }): T => response.data.data;

export const http = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.get<ApiResponse<T>>(url, config);
    return unwrap(response);
  },
  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.post<ApiResponse<T>>(url, body, config);
    return unwrap(response);
  },
  async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.patch<ApiResponse<T>>(url, body, config);
    return unwrap(response);
  },
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.delete<ApiResponse<T>>(url, config);
    return unwrap(response);
  },
};
