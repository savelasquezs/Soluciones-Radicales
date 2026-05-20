import { createRouter, createWebHistory } from 'vue-router';
import { adminGuard, authGuard, technicianGuard } from './guards';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const LoginPage = () => import('@/modules/auth/pages/LoginPage.vue');
const ForgotPasswordPage = () => import('@/modules/auth/pages/ForgotPasswordPage.vue');
const ResetPasswordPage = () => import('@/modules/auth/pages/ResetPasswordPage.vue');
const AdminLayout = () => import('@/modules/layout/pages/AdminLayout.vue');
const TechnicianLayout = () => import('@/modules/layout/pages/TechnicianLayout.vue');
const DashboardPage = () => import('@/modules/dashboard/pages/DashboardPage.vue');
const ClientsPage = () => import('@/modules/clients/pages/ClientsPage.vue');
const ServicesPage = () => import('@/modules/services/pages/ServicesPage.vue');
const SettingsPage = () => import('@/modules/settings/pages/SettingsPage.vue');
const TechnicianSchedulePage = () => import('@/modules/technician/pages/TechnicianSchedulePage.vue');
const TechnicianProfilePage = () => import('@/modules/technician/pages/TechnicianProfilePage.vue');

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginPage, meta: { public: true } },
    { path: '/forgot-password', component: ForgotPasswordPage, meta: { public: true } },
    { path: '/reset-password', component: ResetPasswordPage, meta: { public: true } },
    {
      path: '/',
      component: AdminLayout,
      beforeEnter: [authGuard, adminGuard],
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: DashboardPage },
        { path: 'clients', component: ClientsPage },
        { path: 'services', component: ServicesPage },
        { path: 'settings', component: SettingsPage },
      ],
    },
    {
      path: '/technician',
      component: TechnicianLayout,
      beforeEnter: [authGuard, technicianGuard],
      children: [
        { path: '', redirect: '/technician/schedule' },
        { path: 'schedule', component: TechnicianSchedulePage },
        { path: 'profile', component: TechnicianProfilePage },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.public) {
    return true;
  }

  if (!auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  if (!auth.user && auth.accessToken) {
    await auth.fetchCurrentUser();
  }

  return true;
});
