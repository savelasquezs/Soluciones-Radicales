import type { RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const isPublicPath = (path: string) => {
  return path === '/login' || path === '/forgot-password' || path === '/reset-password';
};

export const resolveRouteAccess = async (to: RouteLocationNormalized) => {
  const auth = useAuthStore();

  if (auth.isAuthenticated && !auth.user) {
    await auth.bootstrapSession();
  }

  if (isPublicPath(to.path)) {
    if (!auth.isAuthenticated) return true;
    return { path: auth.resolveHomePath() };
  }

  if (!auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  const isAdminRoute =
    to.path === '/' ||
    to.path === '/dashboard' ||
    to.path.startsWith('/clients') ||
    to.path.startsWith('/services') ||
    to.path.startsWith('/settings');

  const isTechnicianRoute = to.path.startsWith('/technician');

  if (to.path === '/') {
    return { path: auth.resolveHomePath() };
  }

  if (isAdminRoute && !auth.isAdmin) {
    return { path: auth.resolveHomePath() };
  }

  if (isTechnicianRoute && !auth.isTechnician) {
    return { path: auth.resolveHomePath() };
  }

  return true;
};
