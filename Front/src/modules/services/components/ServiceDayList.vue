<template>
  <AppCard class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-base font-semibold text-foreground">Servicios del día</h3>
      <p v-if="selectedDate" class="text-xs text-foreground/70">
        {{ formatSelectedDate(selectedDate) }}
      </p>
    </div>

    <div v-if="loading" class="flex items-center gap-2 text-sm text-foreground/70">
      <AppSpinner />
      <span>Cargando servicios...</span>
    </div>

    <p v-else-if="services.length === 0" class="text-sm text-foreground/70">
      {{ emptyMessage }}
    </p>

    <ul v-else class="space-y-2">
      <li v-for="service in services" :key="service.id">
        <article class="rounded-xl border border-border bg-background px-3 py-2">
          <div class="flex items-start justify-between gap-3">
            <button
              type="button"
              class="min-w-0 flex-1 space-y-1 text-left"
              @click="$emit('select-service', service.id)"
            >
              <p class="truncate text-xs font-semibold text-foreground">
                {{ service.branchName || service.branchAddress || 'Sucursal sin nombre' }}
              </p>
              <p class="text-xs text-foreground/70">
                {{ formatDateTime(service.scheduledAt) }}
                <span v-if="service.businessName"> · {{ service.businessName }}</span>
              </p>
              <p v-if="service.branchPhone" class="text-[11px] text-foreground/70">
                Sucursal: {{ service.branchPhone }}
              </p>
              <p v-if="service.technicians?.length" class="text-xs text-foreground/70">
                Técnicos:
                {{ service.technicians.map((technician) => technician.name || technician.id).join(', ') }}
              </p>
              <p v-else class="text-xs text-foreground/60">Sin técnico asignado</p>
            </button>
            <ServiceStatusBadge :status="service.status" />
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <AppButton variant="secondary" @click="$emit('change-status', service)">
              Estado
            </AppButton>
            <AppButton variant="secondary" @click="$emit('reschedule', service)">
              Reprogramar
            </AppButton>
            <AppButton variant="secondary" @click="$emit('assign-technicians', service)">
              Técnicos
            </AppButton>
          </div>
        </article>
      </li>
    </ul>
  </AppCard>
</template>

<script setup lang="ts">
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import { formatDate, formatDateTime } from '@/shared/helpers/dates';
import type { Service } from '../types/services.types';
import ServiceStatusBadge from './ServiceStatusBadge.vue';

withDefaults(
  defineProps<{
    services: Service[];
    loading?: boolean;
    selectedDate?: string | Date | null;
    emptyMessage?: string;
  }>(),
  {
    loading: false,
    selectedDate: null,
    emptyMessage: 'No hay servicios para este día.',
  },
);

defineEmits<{
  'select-service': [serviceId: string];
  'change-status': [service: Service];
  reschedule: [service: Service];
  'assign-technicians': [service: Service];
}>();

const formatSelectedDate = (value: string | Date) => {
  if (value instanceof Date) {
    return formatDate(value);
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return formatDate(value);
  }

  return formatDate(new Date(year, month - 1, day));
};
</script>
