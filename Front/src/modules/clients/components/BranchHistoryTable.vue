<template>
  <div class="space-y-4">
    <div v-if="loading" class="rounded-2xl border border-border p-8 text-center text-sm text-foreground/70">
      Cargando historial...
    </div>

    <div v-else-if="!services.length" class="rounded-2xl border border-border p-8 text-center text-sm text-foreground/70">
      {{ emptyMessage }}
    </div>

    <AppTable v-else>
      <thead class="bg-surface text-left text-xs uppercase tracking-wide text-foreground/60">
        <tr>
          <th class="px-4 py-3">Fecha</th>
          <th class="px-4 py-3">Tipo</th>
          <th class="px-4 py-3">Estado</th>
          <th class="px-4 py-3">Precio</th>
          <th class="px-4 py-3">Notas</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <tr v-for="service in services" :key="service.id" class="align-top">
          <td class="px-4 py-3 text-sm text-foreground">{{ service.scheduledAt ? formatDateTime(service.scheduledAt) : 'No programada' }}</td>
          <td class="px-4 py-3 text-sm text-foreground">
            {{ service.type === 'main' ? 'Principal' : 'Refuerzo' }}
          </td>
          <td class="px-4 py-3 text-sm text-foreground">
            <AppBadge :tone="statusToneMap[service.status]">{{ statusLabelMap[service.status] }}</AppBadge>
          </td>
          <td class="px-4 py-3 text-sm text-foreground">{{ service.price !== null ? formatCurrencyCOP(service.price) : '—' }}</td>
          <td class="px-4 py-3 text-sm text-foreground/75">{{ service.notes || 'Sin notas' }}</td>
        </tr>
      </tbody>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppTable from '@/shared/components/ui/AppTable.vue';
import { formatDateTime } from '@/shared/helpers/dates';
import { formatCurrencyCOP } from '@/shared/helpers/currency';
import type { BranchHistoryServiceItem } from '../types/clients.types';
import type { ServiceStatus } from '@/shared/types/common';

withDefaults(
  defineProps<{
    services: BranchHistoryServiceItem[];
    loading?: boolean;
    emptyMessage?: string;
  }>(),
  {
    loading: false,
    emptyMessage: 'No hay servicios para mostrar.',
  },
);

const statusLabelMap: Record<ServiceStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  in_progress: 'En progreso',
  completed: 'Completado',
  canceled: 'Cancelado',
  rescheduled: 'Reprogramado',
};

const statusToneMap: Record<ServiceStatus, 'default' | 'success' | 'danger'> = {
  pending: 'default',
  confirmed: 'default',
  in_progress: 'default',
  completed: 'success',
  canceled: 'danger',
  rescheduled: 'danger',
};
</script>
