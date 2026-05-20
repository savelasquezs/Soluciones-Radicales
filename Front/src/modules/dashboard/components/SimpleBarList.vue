<template>
  <ul class="space-y-2">
    <li v-for="item in items" :key="item.label" class="space-y-1">
      <div class="flex items-center justify-between gap-3 text-xs">
        <span class="truncate">{{ item.label }}</span>
        <span class="font-medium">{{ format(item.value) }}</span>
      </div>
      <div class="h-2 w-full rounded bg-muted">
        <div
          class="h-2 rounded bg-primary"
          :style="{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }"
        />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type BarItem = {
  label: string;
  value: number;
};

const props = defineProps<{
  items: BarItem[];
  formatValue?: (value: number) => string;
}>();

const maxValue = computed(() => Math.max(...props.items.map((item) => item.value), 0));

const format = (value: number) => {
  if (props.formatValue) return props.formatValue(value);
  return new Intl.NumberFormat('es-CO').format(value);
};
</script>
