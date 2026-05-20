<template>
  <AppCard class="space-y-3">
    <h3 class="text-lg font-semibold text-foreground">Evidencias</h3>

    <div v-if="loading" class="flex items-center gap-2 text-sm text-foreground/70">
      <AppSpinner />
      <span>Cargando evidencias...</span>
    </div>

    <p v-else-if="evidences.length === 0" class="text-sm text-foreground/70">
      {{ emptyMessage }}
    </p>

    <ul v-else class="grid gap-3 sm:grid-cols-2">
      <li v-for="evidence in evidences" :key="evidence.id" class="rounded-xl border border-border p-2">
        <a :href="evidence.fileUrl" target="_blank" rel="noreferrer" class="text-sm text-primary hover:underline">
          Abrir evidencia
        </a>
      </li>
    </ul>
  </AppCard>
</template>

<script setup lang="ts">
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import type { ServiceEvidence } from '../types/services.types';

withDefaults(
  defineProps<{
    evidences: ServiceEvidence[];
    loading?: boolean;
    emptyMessage?: string;
  }>(),
  {
    loading: false,
    emptyMessage: 'No hay evidencias registradas.',
  },
);
</script>
