<template>
  <section class="space-y-4">
    <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-2xl font-semibold">Dashboard</h2>
        <p class="text-sm text-foreground/70">Resumen administrativo del periodo seleccionado.</p>
      </div>
      <AppButton variant="secondary" :disabled="isLoading" @click="loadDashboard">Reintentar</AppButton>
    </header>

    <DateRangeFilter :from="from" :to="to" :loading="isLoading" @apply="onApplyFilters" @reset="onResetFilters" />

    <p v-if="errorMessage" class="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {{ errorMessage }}
    </p>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        v-for="item in metricCards"
        :key="item.title"
        :title="item.title"
        :value="item.value"
        :description="item.description"
        :loading="isLoading"
        :tone="item.tone"
      />
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Ventas por periodo" :loading="isLoading" :empty="salesByPeriod.length === 0">
        <SimpleBarList :items="salesByPeriod" :format-value="formatCurrencyCOP" />
      </ChartCard>

      <ChartCard title="Servicios por estado" :loading="isLoading" :empty="servicesByStatus.length === 0">
        <SimpleBarList :items="servicesByStatus" />
      </ChartCard>
    </div>

    <ChartCard title="Top clientes" :loading="isLoading" :empty="topClients.length === 0">
      <AppTable>
        <thead>
          <tr class="text-left text-xs text-foreground/70">
            <th class="px-3 py-2">Cliente</th>
            <th class="px-3 py-2">Ventas</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in topClients" :key="item.id" class="border-t border-border text-sm">
            <td class="px-3 py-2">{{ item.label }}</td>
            <td class="px-3 py-2 font-medium">{{ formatCurrencyCOP(item.value) }}</td>
          </tr>
        </tbody>
      </AppTable>
    </ChartCard>

    <div class="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
      <AlertList
        title="Servicios vencidos"
        :items="alerts.overdueServices"
        :loading="isLoading"
        empty-message="No hay servicios vencidos."
      />
      <AlertList
        title="Ciclos vencidos"
        :items="alerts.overdueCycles"
        :loading="isLoading"
        empty-message="No hay ciclos vencidos."
      />
      <AlertList
        title="Refuerzos pendientes"
        :items="alerts.pendingReinforcements"
        :loading="isLoading"
        empty-message="No hay refuerzos pendientes."
      />
      <AlertList
        title="Transferencias sin soporte"
        :items="alerts.transfersWithoutProof"
        :loading="isLoading"
        empty-message="No hay transferencias sin soporte."
      />
      <AlertList
        title="Completados sin evidencia"
        :items="alerts.completedWithoutEvidence"
        :loading="isLoading"
        empty-message="No hay servicios completados sin evidencia."
      />
    </div>

    <ChartCard title="Próximos servicios (7 días)" :loading="isLoading" :empty="upcomingServices.length === 0">
      <ul class="space-y-2">
        <li
          v-for="service in upcomingServices"
          :key="service.id"
          class="flex flex-col gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p class="font-medium">{{ formatDateTime(service.scheduledAt) }}</p>
            <p class="text-xs text-foreground/70">Servicio {{ service.type }} • #{{ service.id }}</p>
          </div>
          <AppBadge :tone="service.status === 'completed' ? 'success' : service.status === 'canceled' ? 'danger' : 'default'">
            {{ service.status }}
          </AppBadge>
        </li>
      </ul>
    </ChartCard>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppTable from '@/shared/components/ui/AppTable.vue';
import { formatCurrencyCOP } from '@/shared/helpers/currency';
import { formatDateTime } from '@/shared/helpers/dates';
import { dashboardService } from '../services/dashboard.service';
import { servicesService } from '@/modules/services/services/services.service';
import type {
  DashboardAlertItem,
  DashboardAlerts,
  DashboardAnalyticsItem,
  DashboardAnalyticsResponse,
  DashboardFilters,
  DashboardSummary,
} from '../types/dashboard.types';
import type { Service } from '@/modules/services/types/services.types';
import MetricCard from '../components/MetricCard.vue';
import DateRangeFilter from '../components/DateRangeFilter.vue';
import ChartCard from '../components/ChartCard.vue';
import SimpleBarList from '../components/SimpleBarList.vue';
import AlertList from '../components/AlertList.vue';

type BarItem = { label: string; value: number; id?: string };

const summary = ref<DashboardSummary | null>(null);
const salesByPeriod = ref<BarItem[]>([]);
const servicesByStatus = ref<BarItem[]>([]);
const topClients = ref<BarItem[]>([]);
const alerts = ref<DashboardAlerts>({
  overdueServices: [],
  overdueCycles: [],
  pendingReinforcements: [],
  transfersWithoutProof: [],
  completedWithoutEvidence: [],
});
const upcomingServices = ref<Service[]>([]);

const isLoading = ref(false);
const errorMessage = ref('');

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const toInput = (value: Date) => value.toISOString().slice(0, 10);
  return { from: toInput(start), to: toInput(end) };
};

const initialRange = getCurrentMonthRange();
const from = ref(initialRange.from);
const to = ref(initialRange.to);

const toIsoDateStart = (value: string) => `${value}T00:00:00.000Z`;
const toIsoDateEnd = (value: string) => `${value}T23:59:59.999Z`;

const filters = computed<DashboardFilters>(() => ({
  from: from.value ? toIsoDateStart(from.value) : undefined,
  to: to.value ? toIsoDateEnd(to.value) : undefined,
}));

const normalizeAnalyticsItems = (value: DashboardAnalyticsResponse | DashboardAnalyticsItem[]) => {
  if (Array.isArray(value)) return value;
  return value.data ?? [];
};

const mapToBarItems = (items: DashboardAnalyticsItem[]) => {
  return items.map((item) => {
    if ('period' in item) {
      return { label: item.period, value: item.value };
    }

    return { id: item.id, label: item.label ?? item.key, value: item.value };
  });
};

const normalizeAlertItems = (items: DashboardAlertItem[]) => {
  return items.map((item) => {
    if (item.label || item.message) return item;
    if (typeof item.id === 'string') {
      return { ...item, label: `Registro ${item.id}` };
    }
    return item;
  });
};

const metricCards = computed(() => {
  const data = summary.value;
  return [
    {
      title: 'Ventas del periodo',
      value: data ? formatCurrencyCOP(data.salesTotal) : '$0',
      description: 'Suma de servicios del periodo',
      tone: 'success' as const,
    },
    { title: 'Servicios totales', value: data ? String(data.servicesTotal) : '0', tone: 'default' as const },
    { title: 'Completados', value: data ? String(data.servicesCompleted) : '0', tone: 'success' as const },
    { title: 'Pendientes', value: data ? String(data.servicesPending) : '0', tone: 'default' as const },
    { title: 'Cancelados', value: data ? String(data.servicesCanceled) : '0', tone: 'danger' as const },
    { title: 'Reprogramados', value: data ? String(data.servicesRescheduled) : '0', tone: 'default' as const },
    { title: 'Vencidos', value: data ? String(data.overdueServices) : '0', tone: 'danger' as const },
    { title: 'Clientes activos', value: data ? String(data.activeClients) : '0', tone: 'default' as const },
    { title: 'Sucursales activas', value: data ? String(data.activeBranches) : '0', tone: 'default' as const },
    {
      title: 'Tasa de cumplimiento',
      value: data ? `${Number(data.completionRate).toFixed(1)}%` : '0%',
      tone: 'success' as const,
    },
  ];
});

const loadDashboard = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const [
      summaryResponse,
      salesAnalyticsResponse,
      servicesStatusResponse,
      topClientsResponse,
      alertsResponse,
      upcomingServicesResponse,
    ] = await Promise.all([
      dashboardService.getDashboardSummary(filters.value),
      dashboardService.getDashboardAnalytics({
        metric: 'sales',
        groupBy: 'month',
        ...filters.value,
      }),
      dashboardService.getDashboardAnalytics({
        metric: 'services',
        dimension: 'status',
        ...filters.value,
      }),
      dashboardService.getDashboardAnalytics({
        metric: 'sales',
        dimension: 'client',
        sort: 'desc',
        limit: 5,
        ...filters.value,
      }),
      dashboardService.getDashboardAlerts(filters.value),
      servicesService.getUpcomingServices({ days: 7 }),
    ]);

    summary.value = summaryResponse;
    salesByPeriod.value = mapToBarItems(normalizeAnalyticsItems(salesAnalyticsResponse));
    servicesByStatus.value = mapToBarItems(normalizeAnalyticsItems(servicesStatusResponse));
    topClients.value = mapToBarItems(normalizeAnalyticsItems(topClientsResponse));

    alerts.value = {
      overdueServices: normalizeAlertItems(alertsResponse.overdueServices),
      overdueCycles: normalizeAlertItems(alertsResponse.overdueCycles),
      pendingReinforcements: normalizeAlertItems(alertsResponse.pendingReinforcements),
      transfersWithoutProof: normalizeAlertItems(alertsResponse.transfersWithoutProof),
      completedWithoutEvidence: normalizeAlertItems(alertsResponse.completedWithoutEvidence),
    };

    upcomingServices.value = upcomingServicesResponse;
  } catch (error) {
    errorMessage.value = (error as { message?: string }).message ?? 'No fue posible cargar el dashboard.';
  } finally {
    isLoading.value = false;
  }
};

const onApplyFilters = (value: { from: string; to: string }) => {
  from.value = value.from;
  to.value = value.to;
  void loadDashboard();
};

const onResetFilters = () => {
  const range = getCurrentMonthRange();
  from.value = range.from;
  to.value = range.to;
  void loadDashboard();
};

onMounted(() => {
  void loadDashboard();
});
</script>
