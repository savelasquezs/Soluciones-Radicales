<template>
  <AppCard>
    <h3 class="mb-3 text-sm font-semibold">{{ title }}</h3>

    <p v-if="loading" class="text-sm text-foreground/60">Cargando...</p>
    <p v-else-if="items.length === 0" class="text-sm text-foreground/60">{{ emptyMessage }}</p>
    <ul v-else class="space-y-2">
      <li
        v-for="(item, index) in items"
        :key="item.id ?? `${title}-${index}`"
        class="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        {{ resolveLabel(item) }}
      </li>
    </ul>
  </AppCard>
</template>

<script setup lang="ts">
import AppCard from '@/shared/components/ui/AppCard.vue';
import type { DashboardAlertItem } from '../types/dashboard.types';

withDefaults(
  defineProps<{
    title: string;
    items: DashboardAlertItem[];
    emptyMessage: string;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const resolveLabel = (item: DashboardAlertItem) => {
  if (item.label) return item.label;
  if (item.message) return item.message;
  if (item.clientName || item.branchName) {
    return [item.clientName, item.branchName].filter(Boolean).join(' - ');
  }
  if (item.scheduledAt) {
    return `Programado: ${item.scheduledAt}`;
  }
  return 'Alerta sin detalle';
};
</script>
