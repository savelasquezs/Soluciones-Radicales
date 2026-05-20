<template>
  <AppCard>
    <div class="flex flex-col gap-3 md:flex-row md:items-end">
      <div class="w-full">
        <label class="mb-1 block text-xs text-foreground/70">Rango de fechas</label>
        <AppDatePicker v-model="localRange" range placeholder="Selecciona un rango" />
      </div>
      <div class="flex gap-2 md:pb-0.5">
        <AppButton :disabled="loading" @click="onApply">Aplicar</AppButton>
        <AppButton variant="secondary" :disabled="loading" @click="onReset">Este mes</AppButton>
      </div>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppDatePicker from '@/shared/components/ui/AppDatePicker.vue';

const props = withDefaults(
  defineProps<{
    from: string;
    to: string;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  apply: [{ from: string; to: string }];
  reset: [];
}>();

const toDateOrNull = (value: string) => (value ? new Date(`${value}T00:00:00`) : null);
const initialFrom = toDateOrNull(props.from);
const initialTo = toDateOrNull(props.to);
const localRange = ref<[Date, Date] | null>(initialFrom && initialTo ? [initialFrom, initialTo] : null);

watch(
  () => [props.from, props.to],
  ([nextFrom, nextTo]) => {
    const from = toDateOrNull(nextFrom);
    const to = toDateOrNull(nextTo);
    localRange.value = from && to ? [from, to] : null;
  },
);

const toDateString = (value: Date) => {
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const onApply = () => {
  if (!localRange.value) {
    emit('apply', { from: '', to: '' });
    return;
  }

  emit('apply', {
    from: toDateString(localRange.value[0]),
    to: toDateString(localRange.value[1]),
  });
};

const onReset = () => {
  emit('reset');
};
</script>
