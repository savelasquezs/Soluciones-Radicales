<template>
  <AppBadge :tone="tone">
    {{ label }}
  </AppBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import type { ServiceStatus } from '@/shared/types/common';

const props = defineProps<{
  status: ServiceStatus;
}>();

const label = computed(() => {
  if (props.status === 'pending') return 'Pendiente';
  if (props.status === 'confirmed') return 'Confirmado';
  if (props.status === 'in_progress') return 'En progreso';
  if (props.status === 'completed') return 'Completado';
  if (props.status === 'canceled') return 'Cancelado';
  return 'Reprogramado';
});

const tone = computed(() => {
  if (props.status === 'completed' || props.status === 'confirmed') return 'success' as const;
  if (props.status === 'canceled') return 'danger' as const;
  return 'default' as const;
});
</script>
