<template>
  <span :class="['rounded-full px-2 py-1 text-xs font-medium', toneClass]"><slot /></span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ tone?: 'default' | 'success' | 'danger' }>();

const toneClass = computed(() => {
  if (props.tone === 'success') return 'bg-primary/20 text-primary';
  if (props.tone === 'danger') return 'bg-danger/20 text-danger';
  return 'bg-muted text-foreground';
});
</script>