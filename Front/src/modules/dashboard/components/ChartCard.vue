<template>
  <AppCard>
    <div class="mb-3">
      <h3 class="text-sm font-semibold">{{ title }}</h3>
      <p v-if="description" class="text-xs text-foreground/60">{{ description }}</p>
    </div>

    <div v-if="loading" class="text-sm text-foreground/60">Cargando...</div>
    <div v-else-if="empty" class="text-sm text-foreground/60">Sin datos para este periodo.</div>
    <div v-else>
      <slot />
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import AppCard from '@/shared/components/ui/AppCard.vue';

withDefaults(
  defineProps<{
    title: string;
    description?: string;
    loading?: boolean;
    empty?: boolean;
  }>(),
  {
    description: '',
    loading: false,
    empty: false,
  },
);
</script>
