<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Frecuencia principal</p>
        <AppInput v-model="frequencyDays" type="number" placeholder="30" />
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Días para refuerzo</p>
        <AppInput v-model="reinforcementDays" type="number" placeholder="10" />
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Refuerzo habilitado</p>
        <AppSelect v-model="reinforcementEnabled" :options="booleanOptions" />
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Refuerzo pagado</p>
        <AppSelect v-model="reinforcementIsPaid" :options="booleanOptions" />
      </div>

      <div class="space-y-2 sm:col-span-2">
        <p class="text-sm font-medium text-foreground">Atribución de ventas por técnico</p>
        <AppSelect v-model="technicianRevenueMode" :options="revenueModeOptions" />
      </div>
    </div>

    <div class="rounded-2xl border border-border/80 bg-surface p-4 text-sm text-foreground/75">
      <p><span class="font-medium text-foreground">split:</span> divide el valor del servicio entre los técnicos asignados.</p>
      <p><span class="font-medium text-foreground">full:</span> atribuye el valor completo del servicio a cada técnico asignado.</p>
    </div>

    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <div class="flex justify-end gap-2">
      <AppButton type="button" variant="secondary" @click="$emit('cancel')">
        Cancelar
      </AppButton>
      <AppButton type="submit" :disabled="isSubmitting">
        {{ submitLabel }}
      </AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import type { TechnicianRevenueMode } from '@/shared/types/common';

const props = withDefaults(
  defineProps<{
    initialValue?: {
      frequencyDays: number;
      reinforcementDays: number;
      reinforcementEnabled: boolean;
      reinforcementIsPaid: boolean;
      technicianRevenueMode: TechnicianRevenueMode;
    };
    submitLabel?: string;
    isSubmitting?: boolean;
  }>(),
  {
    submitLabel: 'Guardar',
    isSubmitting: false,
  },
);

const emit = defineEmits<{
  submit: [
    {
      frequencyDays: number;
      reinforcementDays: number;
      reinforcementEnabled: boolean;
      reinforcementIsPaid: boolean;
      technicianRevenueMode: TechnicianRevenueMode;
    },
  ];
  cancel: [];
}>();

const frequencyDays = ref(props.initialValue?.frequencyDays?.toString() ?? '');
const reinforcementDays = ref(props.initialValue?.reinforcementDays?.toString() ?? '');
const reinforcementEnabled = ref(props.initialValue?.reinforcementEnabled ? 'true' : 'false');
const reinforcementIsPaid = ref(props.initialValue?.reinforcementIsPaid ? 'true' : 'false');
const technicianRevenueMode = ref<TechnicianRevenueMode>(props.initialValue?.technicianRevenueMode ?? 'split');
const error = ref('');

watch(
  () => props.initialValue,
  (value) => {
    frequencyDays.value = value?.frequencyDays?.toString() ?? '';
    reinforcementDays.value = value?.reinforcementDays?.toString() ?? '';
    reinforcementEnabled.value = value?.reinforcementEnabled ? 'true' : 'false';
    reinforcementIsPaid.value = value?.reinforcementIsPaid ? 'true' : 'false';
    technicianRevenueMode.value = value?.technicianRevenueMode ?? 'split';
    error.value = '';
  },
  { deep: true },
);

const booleanOptions = [
  { label: 'No', value: 'false' },
  { label: 'Sí', value: 'true' },
];

const revenueModeOptions = [
  { label: 'split', value: 'split' },
  { label: 'full', value: 'full' },
];

const parseNumber = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const handleSubmit = () => {
  error.value = '';

  const frequency = parseNumber(frequencyDays.value);
  const reinforcement = parseNumber(reinforcementDays.value);

  if (frequency === undefined || frequency <= 0) {
    error.value = 'La frecuencia debe ser mayor a 0.';
    return;
  }

  if (reinforcement === undefined || reinforcement < 0) {
    error.value = 'Los días de refuerzo deben ser 0 o mayores.';
    return;
  }

  emit('submit', {
    frequencyDays: frequency,
    reinforcementDays: reinforcement,
    reinforcementEnabled: reinforcementEnabled.value === 'true',
    reinforcementIsPaid: reinforcementIsPaid.value === 'true',
    technicianRevenueMode: technicianRevenueMode.value,
  });
};
</script>
