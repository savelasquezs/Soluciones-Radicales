<template>
  <AppCard class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-foreground">Servicios del día</h3>
      <p v-if="selectedDate" class="text-xs text-foreground/70">{{ formatDate(selectedDate) }}</p>
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
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-left hover:bg-surface"
          @click="$emit('select-service', service.id)"
        >
          <div class="space-y-1">
            <p class="text-xs font-semibold text-foreground">
              {{ service.branchName || service.branchAddress || 'Sucursal sin nombre' }}
            </p>
            <p class="text-xs text-foreground/70">
              {{ formatDateTime(service.scheduledAt) }}
              <span v-if="service.businessName">· {{ service.businessName }}</span>
            </p>
            <p v-if="service.branchPhone" class="text-[11px] text-foreground/70">Sucursal: {{ service.branchPhone }}</p>
            <p v-if="service.technicians?.length" class="text-xs text-foreground/70">
              Técnicos: {{ service.technicians.map((technician) => technician.name || technician.id).join(', ') }}
            </p>
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
}>();
</script>
