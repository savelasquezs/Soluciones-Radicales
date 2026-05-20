<template>
  <section class="space-y-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Servicios</h1>
        <p class="text-sm text-foreground/70">Gestión administrativa de servicios del periodo actual.</p>
      </div>
      <div class="flex gap-2">
        <AppButton variant="secondary" @click="goCalendar">Calendario</AppButton>
        <AppButton @click="isCreateModalOpen = true">Nuevo servicio</AppButton>
      </div>
    </header>

    <AppCard class="space-y-3">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div class="space-y-2 xl:col-span-2">
          <p class="text-sm font-medium text-foreground">Rango de fechas</p>
          <AppDatePicker v-model="dateRange" range placeholder="Selecciona un rango" />
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">Estado</p>
          <AppSelect v-model="filters.status" :options="statusOptions" />
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">Tipo</p>
          <AppSelect v-model="filters.type" :options="typeOptions" />
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">Técnico</p>
          <AppSelect v-model="filters.technicianId" :options="technicianOptions" />
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <AppButton variant="secondary" @click="clearFilters">Limpiar</AppButton>
        <AppButton @click="loadServices">Aplicar filtros</AppButton>
      </div>
    </AppCard>

    <AppCard v-if="isLoading" class="flex items-center gap-2 text-sm text-foreground/70">
      <AppSpinner />
      <span>Cargando servicios...</span>
    </AppCard>
    <AppCard v-else-if="error" class="text-sm text-danger">{{ error }}</AppCard>
    <AppCard v-else-if="filteredServices.length === 0" class="text-sm text-foreground/70">
      No hay servicios para el filtro actual.
    </AppCard>
    <AppTable v-else>
      <thead>
        <tr class="text-left text-xs text-foreground/70">
          <th class="px-3 py-2">Fecha</th>
          <th class="px-3 py-2">Sucursal</th>
          <th class="px-3 py-2">Negocio</th>
          <th class="px-3 py-2">Tipo</th>
          <th class="px-3 py-2">Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="service in filteredServices"
          :key="service.id"
          class="cursor-pointer border-t border-border text-sm hover:bg-surface"
          @click="goDetail(service.id)"
        >
          <td class="px-3 py-2">{{ formatDateTime(service.scheduledAt) }}</td>
          <td class="px-3 py-2">{{ service.branchAddress || service.branchName || service.branchId }}</td>
          <td class="px-3 py-2">{{ service.businessName || 'No disponible' }}</td>
          <td class="px-3 py-2">{{ service.type }}</td>
          <td class="px-3 py-2"><ServiceStatusBadge :status="service.status" /></td>
        </tr>
      </tbody>
    </AppTable>

    <TechnicianSchedulePanel
      v-if="filters.technicianId"
      :schedule="technicianSchedule"
      :loading="isLoadingTechnicianSchedule"
      @select-service="goDetail"
    />

    <AppModal :open="isCreateModalOpen" size="md" @close="isCreateModalOpen = false">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Nuevo servicio</h3>
        <ServiceForm :submitting="isSubmitting" @submit="createService" @cancel="isCreateModalOpen = false" />
      </div>
    </AppModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usersService } from '@/modules/users/services/users.service';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppDatePicker from '@/shared/components/ui/AppDatePicker.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import AppTable from '@/shared/components/ui/AppTable.vue';
import { useToast } from '@/shared/composables/useToast';
import { formatDateTime } from '@/shared/helpers/dates';
import ServiceForm from '../components/ServiceForm.vue';
import ServiceStatusBadge from '../components/ServiceStatusBadge.vue';
import TechnicianSchedulePanel from '../components/TechnicianSchedulePanel.vue';
import { servicesService } from '../services/services.service';
import type { Service, TechnicianScheduleResponse } from '../types/services.types';

const router = useRouter();
const { push: pushToast } = useToast();

const services = ref<Service[]>([]);
const filteredServices = ref<Service[]>([]);
const technicians = ref<Array<{ id: string; name: string }>>([]);
const technicianSchedule = ref<TechnicianScheduleResponse | null>(null);

const isLoading = ref(false);
const isLoadingTechnicianSchedule = ref(false);
const isSubmitting = ref(false);
const isCreateModalOpen = ref(false);
const error = ref('');
const dateRange = ref<[Date, Date] | null>(null);

const filters = reactive({
  status: '',
  type: '',
  technicianId: '',
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

const technicianOptions = computed(() => [
  { label: 'Todos', value: '' },
  ...technicians.value.map((technician) => ({ label: technician.name, value: technician.id })),
]);

const getCurrentMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const loadServices = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    const currentMonth = getCurrentMonth();
    services.value = await servicesService.getServicesByMonth(currentMonth);
    filteredServices.value = services.value.filter((service) => {
      if (filters.status && service.status !== filters.status) return false;
      if (filters.type && service.type !== filters.type) return false;

      const scheduled = new Date(service.scheduledAt).getTime();
      if (dateRange.value?.[0] && scheduled < new Date(dateRange.value[0]).setHours(0, 0, 0, 0)) return false;
      if (dateRange.value?.[1] && scheduled > new Date(dateRange.value[1]).setHours(23, 59, 59, 999)) return false;
      return true;
    });
  } catch {
    error.value = 'No se pudieron cargar los servicios.';
  } finally {
    isLoading.value = false;
  }
};

const loadTechnicians = async () => {
  try {
    const result = await usersService.listTechnicians();
    technicians.value = result.map((technician) => ({ id: technician.id, name: technician.name }));
  } catch {
    technicians.value = [];
  }
};

watch(
  () => filters.technicianId,
  async (technicianId) => {
    if (!technicianId) {
      technicianSchedule.value = null;
      return;
    }
    isLoadingTechnicianSchedule.value = true;
    try {
      technicianSchedule.value = await servicesService.getTechnicianSchedule(technicianId);
    } catch {
      technicianSchedule.value = null;
    } finally {
      isLoadingTechnicianSchedule.value = false;
    }
  },
);

const createService = async (payload: Parameters<typeof servicesService.createService>[0]) => {
  isSubmitting.value = true;
  try {
    await servicesService.createService(payload);
    pushToast('Servicio creado.');
    isCreateModalOpen.value = false;
    await loadServices();
  } catch {
    pushToast('No se pudo crear el servicio.');
  } finally {
    isSubmitting.value = false;
  }
};

const clearFilters = () => {
  filters.status = '';
  filters.type = '';
  filters.technicianId = '';
  dateRange.value = null;
  void loadServices();
};

const goCalendar = () => {
  void router.push('/services/calendar');
};

const goDetail = (id: string) => {
  void router.push(`/services/${id}`);
};

onMounted(async () => {
  await Promise.all([loadServices(), loadTechnicians()]);
});
</script>
