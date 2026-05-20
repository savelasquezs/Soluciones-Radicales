<template>
  <div class="space-y-6">
    <section class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Historial de sucursal</h1>
        <p class="text-sm text-foreground/70">Consulta servicios por rango de fechas, estado y tipo.</p>
      </div>
      <AppButton variant="secondary" @click="goBack">Volver</AppButton>
    </section>

    <AppCard class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">Desde</p>
          <AppDatePicker v-model="filters.from" placeholder="Fecha inicial" />
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">Hasta</p>
          <AppDatePicker v-model="filters.to" placeholder="Fecha final" />
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">Estado</p>
          <AppSelect v-model="filters.status" :options="statusOptions" />
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">Tipo</p>
          <AppSelect v-model="filters.type" :options="typeOptions" />
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <AppButton variant="secondary" @click="clearFilters">Limpiar</AppButton>
        <AppButton @click="loadHistory">Aplicar filtros</AppButton>
      </div>
    </AppCard>

    <AppCard v-if="isLoading" class="flex items-center justify-center gap-3 p-8 text-sm text-foreground/70">
      <AppSpinner />
      <span>Cargando historial...</span>
    </AppCard>

    <AppCard v-else-if="error" class="p-8 text-center text-sm text-danger">
      {{ error }}
    </AppCard>

    <template v-else-if="history">
      <AppCard class="space-y-3">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide text-foreground/60">Sucursal</p>
            <h2 class="text-lg font-semibold text-foreground">{{ history.branch.address }}</h2>
            <p class="text-sm text-foreground/70">{{ history.branch.city || 'Sin ciudad' }}</p>
            <p class="text-sm text-foreground/70">{{ history.branch.phone || 'Sin teléfono registrado' }}</p>
          </div>

          <div class="grid gap-2 text-sm text-foreground/70 sm:grid-cols-2">
            <p>Frecuencia: {{ history.branch.frequencyDays ?? '—' }} días</p>
            <p>Refuerzo: {{ history.branch.reinforcementEnabled ? 'Sí' : 'No' }}</p>
          </div>
        </div>
      </AppCard>

      <BranchHistoryTable
        :services="history.services"
        :loading="false"
        emptyMessage="No hay servicios en el rango seleccionado."
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppDatePicker from '@/shared/components/ui/AppDatePicker.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import BranchHistoryTable from '../components/BranchHistoryTable.vue';
import { clientsService } from '../services/clients.service';
import type { BranchHistoryQuery, BranchHistoryResponse } from '../types/clients.types';

const route = useRoute();
const router = useRouter();

const branchId = String(route.params.branchId);
const clientId = String(route.params.id);

const history = ref<BranchHistoryResponse | null>(null);
const isLoading = ref(false);
const error = ref('');
const filters = reactive({
  from: null as Date | null,
  to: null as Date | null,
  status: '',
  type: '',
});

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Completado', value: 'completed' },
  { label: 'Cancelado', value: 'canceled' },
  { label: 'Reprogramado', value: 'rescheduled' },
];

const typeOptions = [
  { label: 'Todos', value: '' },
  { label: 'Principal', value: 'main' },
  { label: 'Refuerzo', value: 'reinforcement' },
];

const buildQuery = (): BranchHistoryQuery => {
  const query: BranchHistoryQuery = {};

  if (filters.from) {
    const from = new Date(filters.from);
    from.setHours(0, 0, 0, 0);
    query.from = from.toISOString();
  }

  if (filters.to) {
    const endDate = new Date(filters.to);
    endDate.setHours(23, 59, 59, 999);
    query.to = endDate.toISOString();
  }

  if (filters.status) {
    query.status = filters.status as BranchHistoryQuery['status'];
  }

  if (filters.type) {
    query.type = filters.type as BranchHistoryQuery['type'];
  }

  return query;
};

const loadHistory = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    history.value = await clientsService.getBranchHistory(branchId, buildQuery());
  } catch {
    error.value = 'No se pudo cargar el historial de la sucursal.';
  } finally {
    isLoading.value = false;
  }
};

const clearFilters = () => {
  filters.from = null;
  filters.to = null;
  filters.status = '';
  filters.type = '';
  void loadHistory();
};

const goBack = () => {
  void router.push(`/clients/${clientId}`);
};

onMounted(() => {
  void loadHistory();
});
</script>
