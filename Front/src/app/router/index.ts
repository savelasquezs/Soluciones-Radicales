import { createRouter, createWebHistory } from 'vue-router';
import { resolveRouteAccess } from './guards';

const LoginPage = () => import('@/modules/auth/pages/LoginPage.vue');
const ForgotPasswordPage = () =>
	import('@/modules/auth/pages/ForgotPasswordPage.vue');
const ResetPasswordPage = () =>
	import('@/modules/auth/pages/ResetPasswordPage.vue');

const AdminLayout = () => import('@/modules/layout/pages/AdminLayout.vue');
const TechnicianLayout = () =>
	import('@/modules/layout/pages/TechnicianLayout.vue');

const DashboardPage = () =>
	import('@/modules/dashboard/pages/DashboardPage.vue');
const ClientsPage = () => import('@/modules/clients/pages/ClientsPage.vue');
const ClientDetailPage = () =>
	import('@/modules/clients/pages/ClientDetailPage.vue');
const BranchHistoryPage = () =>
	import('@/modules/clients/pages/BranchHistoryPage.vue');
const ServicesPage = () => import('@/modules/services/pages/ServicesPage.vue');
const ServicesCalendarPage = () =>
	import('@/modules/services/pages/ServicesCalendarPage.vue');
const ServiceDetailPage = () =>
	import('@/modules/services/pages/ServiceDetailPage.vue');
const SettingsPage = () => import('@/modules/settings/pages/SettingsPage.vue');
const CompanySettingsPage = () =>
	import('@/modules/settings/pages/CompanySettingsPage.vue');
const PaymentMethodsPage = () =>
	import('@/modules/settings/pages/PaymentMethodsPage.vue');

const TechnicianSchedulePage = () =>
	import('@/modules/technician/pages/TechnicianSchedulePage.vue');
const TechnicianProfilePage = () =>
	import('@/modules/technician/pages/TechnicianProfilePage.vue');

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
				{ path: 'clients/:id', component: ClientDetailPage },
				{
					path: 'clients/:id/branches/:branchId/history',
					component: BranchHistoryPage,
				},
				{ path: 'services', component: ServicesPage },
				{ path: 'services/calendar', component: ServicesCalendarPage },
				{ path: 'services/:id', component: ServiceDetailPage },
				{ path: 'settings', component: SettingsPage },
				{ path: 'settings/company', component: CompanySettingsPage },
				{ path: 'settings/payment-methods', component: PaymentMethodsPage },
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
