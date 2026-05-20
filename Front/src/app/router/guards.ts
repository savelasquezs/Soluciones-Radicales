import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

export const authGuard = (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const auth = useAuthStore();
  if (!auth.isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }
  next();
};

export const adminGuard = (
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const auth = useAuthStore();
  if (!auth.isAdmin) {
    next('/technician');
    return;
  }
  next();
};

export const technicianGuard = (
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const auth = useAuthStore();
  if (!auth.isTechnician) {
    next('/dashboard');
    return;
  }
  next();
};