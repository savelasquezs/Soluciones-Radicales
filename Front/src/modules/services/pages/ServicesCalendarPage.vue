<template>
  <section ref="pageRef" class="services-calendar-page">
    <header class="flex flex-wrap items-center justify-end gap-2">
      <div class="grid grid-cols-2 gap-2 sm:flex">
        <AppSelect v-model="selectedMonth" :options="monthOptions" />
        <AppSelect v-model="selectedYear" :options="yearOptions" />
      </div>
      <div class="space-y-3">
        <AppSelect v-model="selectedTechnicianId" :options="technicianOptions" />
      </div>
      <AppButton variant="secondary" @click="goServices">
        Volver a servicios
      </AppButton>
      <AppButton @click="openCreateModal">Nuevo servicio</AppButton>
    </header>

    <div class="calendar-content">
      <AppCard
        v-if="isLoading && services.length === 0"
        class="flex items-center gap-2 text-sm text-foreground/70"
      >
        <AppSpinner />
        <span>Cargando servicios del mes...</span>
      </AppCard>
      <AppCard v-else-if="error" class="text-sm text-danger">{{ error }}</AppCard>
      <div v-else class="calendar-fill" :style="{ height: `${calendarHeight}px` }">
        <ServicesCalendar
          ref="calendarRef"
          :initial-date="calendarInitialDate"
          :services="calendarServices"
          @select-date="selectDate"
          @select-service="goDetail"
          @change-month="handleMonthChange"
        />
      </div>
    </div>

    <AppModal :open="isCreateModalOpen" size="md" @close="isCreateModalOpen = false">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Nuevo servicio</h3>
        <ServiceForm
          :submitting="isSubmitting"
          :initialScheduledAt="selectedDate ? `${selectedDate}T09:00:00.000Z` : null"
          @submit="createService"
          @cancel="isCreateModalOpen = false"
        />
      </div>
    </AppModal>

    <AppModal :open="isDayModalOpen" size="md" @close="isDayModalOpen = false">
      <ServiceDayList
        :services="visibleDayServices"
        :loading="false"
        :selected-date="selectedDate"
        :empty-message="dayEmptyMessage"
        @select-service="goDetail"
        @change-status="openStatusModal"
        @reschedule="openRescheduleModal"
        @assign-technicians="openAssignModal"
      />
    </AppModal>

    <AppModal :open="isStatusModalOpen" size="sm" @close="isStatusModalOpen = false">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Cambiar estado</h3>
        <AppSelect v-model="selectedStatus" :options="statusOptions" />
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="isStatusModalOpen = false">Cancelar</AppButton>
          <AppButton :disabled="isSubmitting" @click="updateStatus">Guardar</AppButton>
        </div>
      </div>
    </AppModal>

    <AppModal :open="isRescheduleModalOpen" size="sm" @close="isRescheduleModalOpen = false">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Reprogramar servicio</h3>
        <AppDatePicker v-model="rescheduleDate" enable-time-picker placeholder="Nueva fecha y hora" />
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="isRescheduleModalOpen = false">Cancelar</AppButton>
          <AppButton :disabled="isSubmitting" @click="rescheduleService">Guardar</AppButton>
        </div>
      </div>
    </AppModal>

    <AssignTechniciansModal
      :open="isAssignModalOpen"
      :submitting="isSubmitting"
      :model-value="selectedService?.technicians?.map((item) => item.id) ?? []"
      @close="isAssignModalOpen = false"
      @submit="assignTechnicians"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usersService } from '@/modules/users/services/users.service';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppDatePicker from '@/shared/components/ui/AppDatePicker.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import { useToast } from '@/shared/composables/useToast';
import AssignTechniciansModal from '../components/AssignTechniciansModal.vue';
import ServiceDayList from '../components/ServiceDayList.vue';
import ServiceForm from '../components/ServiceForm.vue';
import ServicesCalendar from '../components/ServicesCalendar.vue';
import { servicesService } from '../services/services.service';
import type { Service, TechnicianScheduleResponse } from '../types/services.types';

const router = useRouter();
const { push: pushToast } = useToast();

const pageRef = ref<HTMLElement | null>(null);
const calendarRef = ref<InstanceType<typeof ServicesCalendar> | null>(null);
const services = ref<Service[]>([]);
const selectedService = ref<Service | null>(null);
const selectedDate = ref('');
const selectedTechnicianId = ref('');
const selectedMonth = ref(String(new Date().getMonth() + 1));
const selectedYear = ref(String(new Date().getFullYear()));
const selectedStatus = ref<Service['status']>('pending');
const rescheduleDate = ref<Date | null>(null);
const technicians = ref<Array<{ id: string; name: string }>>([]);
const technicianSchedule = ref<TechnicianScheduleResponse | null>(null);

const isLoading = ref(false);
const isLoadingTechnicianSchedule = ref(false);
const isCreateModalOpen = ref(false);
const isDayModalOpen = ref(false);
const isStatusModalOpen = ref(false);
const isRescheduleModalOpen = ref(false);
const isAssignModalOpen = ref(false);
const isSubmitting = ref(false);
const isProgrammaticNavigation = ref(false);
const error = ref('');
const calendarHeight = ref(560);

const currentMonth = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
});

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Completado', value: 'completed' },
  { label: 'Cancelado', value: 'canceled' },
  { label: 'Reprogramado', value: 'rescheduled' },
];

const calendarInitialDate = computed(
  () => `${currentMonth.value.year}-${String(currentMonth.value.month).padStart(2, '0')}-01`,
);

const monthOptions = [
  { label: 'Enero', value: '1' },
  { label: 'Febrero', value: '2' },
  { label: 'Marzo', value: '3' },
  { label: 'Abril', value: '4' },
  { label: 'Mayo', value: '5' },
  { label: 'Junio', value: '6' },
  { label: 'Julio', value: '7' },
  { label: 'Agosto', value: '8' },
  { label: 'Septiembre', value: '9' },
  { label: 'Octubre', value: '10' },
  { label: 'Noviembre', value: '11' },
  { label: 'Diciembre', value: '12' },
];

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => {
    const year = currentYear - 3 + index;
    return { label: String(year), value: String(year) };
  });
});

const technicianOptions = computed(() => [
  { label: 'Todos los técnicos', value: '' },
  ...technicians.value.map((technician) => ({
    label: technician.name,
    value: technician.id,
  })),
]);

const calendarServices = computed<Service[]>(() => {
  if (!selectedTechnicianId.value) {
    return services.value;
  }
  return technicianSchedule.value?.services ?? [];
});

const visibleDayServices = computed(() => {
  if (!selectedDate.value) {
    return [];
  }

  return calendarServices.value.filter((service) => {
    return getLocalDateKey(service.scheduledAt) === selectedDate.value;
  });
});

const selectedTechnicianName = computed(() =>
  technicians.value.find((technician) => technician.id === selectedTechnicianId.value)?.name,
);

const dayEmptyMessage = computed(() => {
  if (selectedTechnicianName.value) {
    return `No hay servicios para ${selectedTechnicianName.value} en este día.`;
  }
  return 'No hay servicios para este día.';
});

const updateCalendarHeight = () => {
  if (!pageRef.value) return;

  const pageTop = pageRef.value.getBoundingClientRect().top;
  const availableHeight = window.innerHeight - pageTop - 16;
  calendarHeight.value = Math.max(448, availableHeight);
};

const getLocalDateKey = (value: string | Date) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadMonth = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    services.value = await servicesService.getServicesByMonth(currentMonth.value);
  } catch {
    error.value = 'No se pudieron cargar los servicios del mes.';
  } finally {
    isLoading.value = false;
  }
};

const refreshCalendarData = async () => {
  await loadMonth();
  if (selectedTechnicianId.value) {
    technicianSchedule.value = await servicesService.getTechnicianSchedule(
      selectedTechnicianId.value,
    );
  }
};

const navigateToMonth = async (month: number, year: number) => {
  if (
    currentMonth.value.month === month &&
    currentMonth.value.year === year
  ) {
    return;
  }

  isProgrammaticNavigation.value = true;
  currentMonth.value = { month, year };
  selectedMonth.value = String(month);
  selectedYear.value = String(year);
  await nextTick();
  calendarRef.value?.goToDate(new Date(year, month - 1, 1));
  await loadMonth();
  window.setTimeout(() => {
    isProgrammaticNavigation.value = false;
  }, 0);
};

const loadTechnicians = async () => {
  try {
    const data = await usersService.listTechnicians();
    technicians.value = data.map((technician) => ({
      id: technician.id,
      name: technician.name,
    }));
  } catch {
    technicians.value = [];
  }
};

watch(selectedTechnicianId, async (technicianId) => {
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
});

watch([selectedMonth, selectedYear], ([month, year]) => {
  void navigateToMonth(Number(month), Number(year));
});

const selectDate = async (date: string) => {
  selectedDate.value = date.split('T')[0] ?? date;
  isDayModalOpen.value = true;
};

const handleMonthChange = (payload: { year: number; month: number }) => {
  if (isProgrammaticNavigation.value) {
    return;
  }

  if (
    currentMonth.value.year === payload.year &&
    currentMonth.value.month === payload.month
  ) {
    return;
  }

  currentMonth.value = payload;
  selectedMonth.value = String(payload.month);
  selectedYear.value = String(payload.year);
  void loadMonth();
};

const openCreateModal = () => {
  isCreateModalOpen.value = true;
};

const openStatusModal = (service: Service) => {
  selectedService.value = service;
  selectedStatus.value = service.status;
  isStatusModalOpen.value = true;
};

const openRescheduleModal = (service: Service) => {
  selectedService.value = service;
  rescheduleDate.value = new Date(service.scheduledAt);
  isRescheduleModalOpen.value = true;
};

const openAssignModal = (service: Service) => {
  selectedService.value = service;
  isAssignModalOpen.value = true;
};

const updateStatus = async () => {
  if (!selectedService.value) return;
  isSubmitting.value = true;
  try {
    await servicesService.updateServiceStatus(selectedService.value.id, {
      status: selectedStatus.value,
    });
    pushToast('Estado actualizado.');
    isStatusModalOpen.value = false;
    await refreshCalendarData();
  } catch {
    pushToast('No se pudo actualizar el estado.');
  } finally {
    isSubmitting.value = false;
  }
};

const rescheduleService = async () => {
  if (!selectedService.value || !rescheduleDate.value) return;
  isSubmitting.value = true;
  try {
    await servicesService.rescheduleService(selectedService.value.id, {
      scheduledAt: rescheduleDate.value.toISOString(),
    });
    pushToast('Servicio reprogramado.');
    isRescheduleModalOpen.value = false;
    await refreshCalendarData();
  } catch {
    pushToast('No se pudo reprogramar el servicio.');
  } finally {
    isSubmitting.value = false;
  }
};

const assignTechnicians = async (technicianIds: string[]) => {
  if (!selectedService.value) return;
  isSubmitting.value = true;
  try {
    await servicesService.assignTechniciansToService(selectedService.value.id, {
      technicianIds,
    });
    pushToast('Técnicos asignados.');
    isAssignModalOpen.value = false;
    await refreshCalendarData();
  } catch {
    pushToast('No se pudieron asignar técnicos.');
  } finally {
    isSubmitting.value = false;
  }
};

const createService = async (payload: Parameters<typeof servicesService.createService>[0]) => {
  isSubmitting.value = true;
  try {
    await servicesService.createService(payload);
    pushToast('Servicio creado.');
    isCreateModalOpen.value = false;
    await refreshCalendarData();
  } catch {
    pushToast('No se pudo crear el servicio.');
  } finally {
    isSubmitting.value = false;
  }
};

const goDetail = (id: string) => {
  void router.push(`/services/${id}`);
};

const goServices = () => {
  void router.push('/services');
};

onMounted(async () => {
  await Promise.all([loadMonth(), loadTechnicians()]);
  await nextTick();
  updateCalendarHeight();
  window.addEventListener('resize', updateCalendarHeight);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCalendarHeight);
});
</script>

<style scoped>
.services-calendar-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.calendar-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.calendar-fill {
  min-height: 28rem;
}

.calendar-fill :deep(.services-calendar-card) {
  height: 100%;
}

@media (max-width: 768px) {
  .calendar-fill {
    min-height: 28rem;
  }
}
</style>
