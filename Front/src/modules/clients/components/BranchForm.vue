<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-2 sm:col-span-2">
        <p class="text-sm font-medium text-foreground">Direccion</p>
        <AppInput v-model="form.address" placeholder="Direccion de la sucursal" />
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Ciudad</p>
        <AppSelect v-model="form.city" :options="cityOptions" />
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Telefono</p>
        <AppInput v-model="form.phone" placeholder="3001234567" />
      </div>

      <div class="space-y-2 sm:col-span-2">
        <p class="text-sm font-medium text-foreground">Proximo servicio principal</p>
        <AppDatePicker
          v-model="form.nextMainServiceDate"
          enableTimePicker
          :minDate="minDateTime"
          placeholder="Selecciona fecha y hora"
        />
      </div>

      <div class="space-y-2 sm:col-span-2">
        <p class="text-sm font-medium text-foreground">Proximo refuerzo (calculado)</p>
        <AppDatePicker
          :model-value="nextReinforcementDateDisplay"
          enableTimePicker
          disabled
          placeholder="Calculado automaticamente"
        />
      </div>

      <div class="space-y-2 sm:col-span-2">
        <p class="text-sm font-medium text-foreground">Modo de cobro</p>
        <AppSelect v-model="form.pricingMode" :options="pricingModeOptions" />
      </div>

      <template v-if="form.pricingMode === PRICING_MODES.fixed">
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">Precio fijo</p>
          <AppInput v-model="form.fixedPrice" type="number" placeholder="250000" />
        </div>
      </template>

      <template v-else>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">Precio por m2</p>
          <AppInput v-model="form.pricePerM2" type="number" placeholder="1200" />
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">Metros cuadrados</p>
          <AppInput v-model="form.squareMeters" type="number" placeholder="100" />
        </div>
        <div class="space-y-2 sm:col-span-2">
          <p class="text-sm font-medium text-foreground">Valor calculado</p>
          <AppInput :model-value="calculatedFixedPrice" type="number" disabled />
        </div>
      </template>
    </div>

    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <div v-if="showActions" class="flex justify-end gap-2">
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
import { computed, reactive, ref, watch } from 'vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppDatePicker from '@/shared/components/ui/AppDatePicker.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import { BRANCH_CITIES, PRICING_MODES, type PricingMode } from '../constants/branch';
import { addDaysToIsoDate } from '../helpers/scheduling';

type BranchFormValue = {
  address: string;
  city: string;
  phone: string;
  pricePerM2: string;
  fixedPrice: string;
  squareMeters: string;
  pricingMode: PricingMode;
  nextMainServiceDate: Date | null;
};

const props = withDefaults(
  defineProps<{
    initialValue?: {
      address?: string;
      city?: string;
      phone?: string;
      pricePerM2?: number | null;
      fixedPrice?: number | null;
      nextMainServiceDate?: string | null;
      reinforcementDays?: number | null;
    };
    submitLabel?: string;
    isSubmitting?: boolean;
    showActions?: boolean;
  }>(),
  {
    submitLabel: 'Guardar',
    isSubmitting: false,
    showActions: true,
  },
);

const emit = defineEmits<{
  submit: [
    {
      address: string;
      city: string;
      phone: string;
      pricePerM2?: number;
      fixedPrice?: number;
      pricingMode: PricingMode;
      squareMeters?: number;
      nextMainServiceDate: string;
      nextReinforcementDate?: string;
    },
  ];
  cancel: [];
}>();

const inferPricingMode = () => {
  if ((props.initialValue?.pricePerM2 ?? 0) > 0) {
    return PRICING_MODES.squareMeter;
  }

  return PRICING_MODES.fixed;
};

const inferSquareMeters = (pricePerM2?: number | null, fixedPrice?: number | null) => {
  if (!pricePerM2 || !fixedPrice || pricePerM2 <= 0) {
    return '';
  }

  const inferredValue = fixedPrice / pricePerM2;
  if (!Number.isFinite(inferredValue) || inferredValue <= 0) {
    return '';
  }

  return String(Math.round(inferredValue * 100) / 100);
};

const form = reactive<BranchFormValue>({
  address: props.initialValue?.address ?? '',
  city: props.initialValue?.city ?? '',
  phone: props.initialValue?.phone ?? '',
  pricePerM2: props.initialValue?.pricePerM2?.toString() ?? '',
  fixedPrice: props.initialValue?.fixedPrice?.toString() ?? '',
  squareMeters: inferSquareMeters(props.initialValue?.pricePerM2, props.initialValue?.fixedPrice),
  pricingMode: inferPricingMode(),
  nextMainServiceDate: props.initialValue?.nextMainServiceDate ? new Date(props.initialValue.nextMainServiceDate) : null,
});

const error = ref('');

const cityOptions = BRANCH_CITIES.map((city) => ({
  label: city,
  value: city,
}));

const pricingModeOptions = [
  { label: 'Precio fijo', value: PRICING_MODES.fixed },
  { label: 'Precio por m2', value: PRICING_MODES.squareMeter },
];

const minDateTime = computed(() => new Date());

const parseNumber = (value: string) => {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const calculatedFixedPrice = computed(() => {
  if (form.pricingMode === PRICING_MODES.fixed) {
    return form.fixedPrice;
  }

  const pricePerM2 = parseNumber(form.pricePerM2);
  const squareMeters = parseNumber(form.squareMeters);

  if (pricePerM2 === undefined || squareMeters === undefined) {
    return '';
  }

  return String(pricePerM2 * squareMeters);
});

const nextReinforcementDateDisplay = computed(() => {
  if (!form.nextMainServiceDate) {
    return null;
  }

  const nextMain = form.nextMainServiceDate.toISOString();
  if (!nextMain) {
    return null;
  }

  const reinforcementDays = props.initialValue?.reinforcementDays ?? 0;
  const nextReinforcement = addDaysToIsoDate(nextMain, reinforcementDays);
  return nextReinforcement ? new Date(nextReinforcement) : null;
});

watch(
  () => props.initialValue,
  (value) => {
    form.address = value?.address ?? '';
    form.city = value?.city ?? '';
    form.phone = value?.phone ?? '';
    form.pricePerM2 = value?.pricePerM2?.toString() ?? '';
    form.fixedPrice = value?.fixedPrice?.toString() ?? '';
    form.squareMeters = inferSquareMeters(value?.pricePerM2, value?.fixedPrice);
    form.pricingMode = value?.pricePerM2 ? PRICING_MODES.squareMeter : PRICING_MODES.fixed;
    form.nextMainServiceDate = value?.nextMainServiceDate ? new Date(value.nextMainServiceDate) : null;
    error.value = '';
  },
  { deep: true },
);

watch(
  () => form.pricingMode,
  (mode) => {
    if (mode === PRICING_MODES.fixed) {
      form.pricePerM2 = '';
      form.squareMeters = '';
      return;
    }

    form.fixedPrice = '';
  },
);

const handleSubmit = () => {
  error.value = '';

  const address = form.address.trim();
  if (address.length < 10) {
    error.value = 'La direccion debe tener minimo 10 caracteres.';
    return;
  }

  if (!form.city.trim()) {
    error.value = 'La ciudad es obligatoria.';
    return;
  }

  const phone = form.phone.trim();
  if (!/^[36]\d{9}$/.test(phone)) {
    error.value = 'El telefono debe tener 10 digitos y comenzar por 3 o 6.';
    return;
  }

  const nextMainServiceDate = form.nextMainServiceDate?.toISOString();
  if (!nextMainServiceDate) {
    error.value = 'La fecha del proximo servicio es obligatoria.';
    return;
  }

  if (new Date(nextMainServiceDate) < new Date()) {
    error.value = 'La fecha del proximo servicio no puede ser anterior a hoy.';
    return;
  }

  const reinforcementDays = props.initialValue?.reinforcementDays ?? 0;
  const nextReinforcementDate = addDaysToIsoDate(nextMainServiceDate, reinforcementDays);

  if (form.pricingMode === PRICING_MODES.fixed) {
    const fixedPrice = parseNumber(form.fixedPrice);

    if (fixedPrice === undefined || fixedPrice <= 0) {
      error.value = 'El precio fijo debe ser un numero mayor a 0.';
      return;
    }

    emit('submit', {
      address,
      city: form.city.trim(),
      phone,
      fixedPrice,
      pricingMode: form.pricingMode,
      nextMainServiceDate,
      nextReinforcementDate,
    });
    return;
  }

  const pricePerM2 = parseNumber(form.pricePerM2);
  const squareMeters = parseNumber(form.squareMeters);

  if (pricePerM2 === undefined || pricePerM2 <= 0) {
    error.value = 'El precio por m2 debe ser un numero mayor a 0.';
    return;
  }

  if (squareMeters === undefined || squareMeters <= 0) {
    error.value = 'Los metros cuadrados deben ser un numero mayor a 0.';
    return;
  }

  emit('submit', {
    address,
    city: form.city.trim(),
    phone,
    pricingMode: form.pricingMode,
    pricePerM2,
    squareMeters,
    fixedPrice: pricePerM2 * squareMeters,
    nextMainServiceDate,
    nextReinforcementDate,
  });
};
</script>
