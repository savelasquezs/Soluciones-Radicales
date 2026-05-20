<template>
  <AppCard>
    <div class="space-y-1">
      <p class="text-xs text-foreground/70">{{ title }}</p>
      <p :class="['text-2xl font-semibold', toneClass]">
        <span v-if="!loading">{{ value }}</span>
        <span v-else class="text-sm text-foreground/60">Cargando...</span>
      </p>
      <p v-if="description" class="text-xs text-foreground/60">{{ description }}</p>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppCard from '@/shared/components/ui/AppCard.vue';

const props = withDefaults(
  defineProps<{
    title: string;
    value: string;
    description?: string;
    loading?: boolean;
    tone?: 'default' | 'success' | 'danger';
  }>(),
  {
    description: '',
    loading: false,
    tone: 'default',
  },
);

const toneClass = computed(() => {
  if (props.tone === 'success') return 'text-primary';
  if (props.tone === 'danger') return 'text-danger';
  return 'text-foreground';
});
</script>
