<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click.self="$emit('close')"
  >
    <div
      class="relative w-full overflow-hidden rounded-2xl bg-card shadow-soft"
      :class="sizeClass"
    >
      <button
        type="button"
        class="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-lg text-foreground/70 transition hover:bg-surface hover:text-foreground"
        aria-label="Cerrar modal"
        @click="$emit('close')"
      >
        ×
      </button>

      <div class="max-h-[85vh] overflow-y-auto p-6 sm:p-7">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }>(),
  {
    size: 'md',
  },
);

defineEmits<{ close: [] }>();

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'max-w-md';
  if (props.size === 'lg') return 'max-w-3xl';
  if (props.size === 'xl') return 'max-w-5xl';
  return 'max-w-2xl';
});
</script>
