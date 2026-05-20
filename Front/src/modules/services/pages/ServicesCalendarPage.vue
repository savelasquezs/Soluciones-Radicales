<template>
  <section ref="pageRef" class="services-calendar-page">
    <header class="flex flex-wrap items-center justify-end gap-2">
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
        v-if="isLoading"
        class="flex items-center gap-2 text-sm text-foreground/70"
      >
        <AppSpinner />
        <span>Cargando servicios del mes...</span>
      </AppCard>
      <AppCard v-else-if="error" class="text-sm text-danger">{{ error }}</AppCard>
      <div v-else class="calendar-fill" :style="{ height: `${calendarHeight}px` }">
        <ServicesCalendar
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
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usersService } from '@/modules/users/services/users.service';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import { useToast } from '@/shared/composables/useToast';
import ServiceForm from '../components/ServiceForm.vue';
import ServicesCalendar from '../components/ServicesCalendar.vue';
import { servicesService } from '../services/services.service';
import type { Service, TechnicianScheduleResponse } from '../types/services.types';

const router = useRouter();
const { push: pushToast } = useToast();

const pageRef = ref<HTMLElement | null>(null);
const services = ref<Service[]>([]);
const selectedDate = ref('');
const selectedTechnicianId = ref('');
const technicians = ref<Array<{ id: string; name: string }>>([]);
const technicianSchedule = ref<TechnicianScheduleResponse | null>(null);

const isLoading = ref(false);
const isLoadingTechnicianSchedule = ref(false);
const isCreateModalOpen = ref(false);
const isSubmitting = ref(false);
const error = ref('');
const calendarHeight = ref(560);

const currentMonth = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
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

const updateCalendarHeight = () => {
  if (!pageRef.value) return;

  const pageTop = pageRef.value.getBoundingClientRect().top;
  const availableHeight = window.innerHeight - pageTop - 16;
  calendarHeight.value = Math.max(448, availableHeight);
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

const selectDate = (date: string) => {
  selectedDate.value = date;
};

const handleMonthChange = (payload: { year: number; month: number }) => {
  if (
    currentMonth.value.year === payload.year &&
    currentMonth.value.month === payload.month
  ) {
    return;
  }

  currentMonth.value = payload;
  void loadMonth();
};

const openCreateModal = () => {
  isCreateModalOpen.value = true;
};

const createService = async (payload: Parameters<typeof servicesService.createService>[0]) => {
  isSubmitting.value = true;
  try {
    await servicesService.createService(payload);
    pushToast('Servicio creado.');
    isCreateModalOpen.value = false;
    await loadMonth();
    if (selectedTechnicianId.value) {
      technicianSchedule.value = await servicesService.getTechnicianSchedule(
        selectedTechnicianId.value,
      );
    }
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
