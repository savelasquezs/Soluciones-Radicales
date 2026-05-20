<template>
  <select
    :value="modelValue"
    class="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
  </select>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string;
  options: Array<{ label: string; value: string }>;
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>