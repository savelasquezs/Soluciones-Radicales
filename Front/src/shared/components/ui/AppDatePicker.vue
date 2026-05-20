<template>
  <div class="space-y-1.5">
    <VueDatePicker
      :model-value="props.modelValue"
      :range="props.range"
      :enable-time-picker="props.enableTimePicker"
      :disabled="props.disabled"
      :placeholder="props.placeholder"
      :min-date="props.minDate"
      :max-date="props.maxDate"
      :dark="isDarkMode"
      :locale="spanishLocale"
      :format="resolvedFormat"
      :is-24="false"
      :teleport="true"
      auto-apply
      class="app-date-picker"
      @update:model-value="(value: DatePickerValue) => $emit('update:modelValue', value)"
    />
    <p v-if="props.error" class="text-xs text-danger">{{ props.error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { es } from 'date-fns/locale/es';
import { format as formatDateFn } from 'date-fns';

type DatePickerValue = Date | Date[] | string | null;

const props = withDefaults(
  defineProps<{
    modelValue: DatePickerValue;
    placeholder?: string;
    disabled?: boolean;
    range?: boolean;
    enableTimePicker?: boolean;
    format?: string;
    minDate?: Date | string;
    maxDate?: Date | string;
    error?: string;
  }>(),
  {
    placeholder: '',
    disabled: false,
    range: false,
    enableTimePicker: false,
    format: undefined,
    minDate: undefined,
    maxDate: undefined,
    error: '',
  },
);

defineEmits<{
  'update:modelValue': [value: DatePickerValue];
}>();

const isDarkMode = ref(false);
const spanishLocale = es;

const resolvedFormat = (date: Date | Date[]) => {
  if (props.format) {
    return props.format;
  }

  if (Array.isArray(date)) {
    if (date.length < 2) return '';
    return `${formatDateFn(date[0], 'dd/MM/yyyy')} - ${formatDateFn(date[1], 'dd/MM/yyyy')}`;
  }

  return props.enableTimePicker
    ? formatDateFn(date, 'dd/MM/yyyy hh:mm aa')
    : formatDateFn(date, 'dd/MM/yyyy');
};
let classObserver: MutationObserver | null = null;

const syncTheme = () => {
  isDarkMode.value = document.documentElement.classList.contains('dark');
};

onMounted(() => {
  syncTheme();
  classObserver = new MutationObserver(syncTheme);
  classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});

onBeforeUnmount(() => {
  classObserver?.disconnect();
  classObserver = null;
});
</script>

<style scoped>
:deep(.dp__theme_light) {
  --dp-background-color: hsl(var(--color-card));
  --dp-text-color: hsl(var(--color-foreground));
  --dp-hover-color: hsl(var(--color-secondary) / 0.35);
  --dp-hover-text-color: hsl(var(--color-foreground));
  --dp-primary-color: hsl(var(--color-primary));
  --dp-primary-text-color: #ffffff;
  --dp-border-color: hsl(var(--color-border));
  --dp-menu-border-color: hsl(var(--color-border));
  --dp-border-radius: 0.75rem;
}

:deep(.dp__theme_dark) {
  --dp-background-color: hsl(var(--color-card));
  --dp-text-color: hsl(var(--color-foreground));
  --dp-hover-color: hsl(var(--color-secondary) / 0.5);
  --dp-hover-text-color: hsl(var(--color-foreground));
  --dp-primary-color: hsl(var(--color-primary));
  --dp-primary-text-color: #ffffff;
  --dp-border-color: hsl(var(--color-border));
  --dp-menu-border-color: hsl(var(--color-border));
  --dp-border-radius: 0.75rem;
}

:deep(.dp__input) {
  border-radius: 0.75rem;
  border-color: hsl(var(--color-border));
  background-color: hsl(var(--color-card));
  color: hsl(var(--color-foreground));
  font-size: 0.875rem;
  min-height: 2.5rem;
}

:deep(.dp__input_focus) {
  border-color: hsl(var(--color-primary));
  box-shadow: 0 0 0 1px hsl(var(--color-primary));
}
</style>
