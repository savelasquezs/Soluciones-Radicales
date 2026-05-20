<template>
  <AppCard class="space-y-3">
    <h3 class="text-lg font-semibold text-foreground">Programación del técnico</h3>

    <div v-if="loading" class="flex items-center gap-2 text-sm text-foreground/70">
      <AppSpinner />
      <span>Cargando programación...</span>
    </div>

    <p v-else-if="!schedule || schedule.services.length === 0" class="text-sm text-foreground/70">
      No hay servicios para el técnico seleccionado.
    </p>

    <ul v-else class="space-y-2">
      <li v-for="service in schedule.services" :key="service.id">
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-left hover:bg-surface"
          @click="$emit('select-service', service.id)"
        >
          <div>
            <p class="text-sm font-medium text-foreground">{{ formatDateTime(service.scheduledAt) }}</p>
            <p class="text-xs text-foreground/70">{{ service.type }} · {{ service.branchAddress || service.branchId }}</p>
          </div>
          <ServiceStatusBadge :status="service.status" />
        </button>
      </li>
    </ul>
  </AppCard>
</template>

<script setup lang="ts">
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import { formatDateTime } from '@/shared/helpers/dates';
import type { TechnicianScheduleResponse } from '../types/services.types';
import ServiceStatusBadge from './ServiceStatusBadge.vue';

withDefaults(
  defineProps<{
    schedule: TechnicianScheduleResponse | null;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

defineEmits<{
  'select-service': [serviceId: string];
}>();
</script>
