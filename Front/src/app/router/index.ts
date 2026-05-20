import { createRouter, createWebHistory } from 'vue-router';
import { resolveRouteAccess } from './guards';

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
    { path: '/login', component: LoginPage },
    { path: '/forgot-password', component: ForgotPasswordPage },
    { path: '/reset-password', component: ResetPasswordPage },
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: 'dashboard', component: DashboardPage },
        { path: 'clients', component: ClientsPage },
        { path: 'services', component: ServicesPage },
        { path: 'settings', component: SettingsPage },
      ],
    },
    {
      path: '/technician',
      component: TechnicianLayout,
      children: [
        { path: 'schedule', component: TechnicianSchedulePage },
        { path: 'profile', component: TechnicianProfilePage },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach(resolveRouteAccess);

