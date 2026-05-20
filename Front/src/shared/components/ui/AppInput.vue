<template>
  <input
    :value="modelValue"
    :type="type"
    :placeholder="placeholder"
    class="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string;
  type?: string;
  placeholder?: string;
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>