<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition',
      variant === 'primary' && 'bg-primary text-white hover:opacity-90',
      variant === 'secondary' && 'bg-muted text-foreground hover:bg-border',
      disabled && 'cursor-not-allowed opacity-50',
    ]"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}>();

defineEmits<{ click: [event: MouseEvent] }>();
</script>