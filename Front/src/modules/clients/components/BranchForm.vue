<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-2 sm:col-span-2">
        <p class="text-sm font-medium text-foreground">Dirección</p>
        <AppInput v-model="form.address" placeholder="Dirección de la sucursal" />
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Ciudad</p>
        <AppInput v-model="form.city" placeholder="Ciudad" />
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Teléfono</p>
        <AppInput v-model="form.phone" placeholder="3001234567" />
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Precio por m²</p>
        <AppInput v-model="form.pricePerM2" type="number" placeholder="1200" />
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Precio fijo</p>
        <AppInput v-model="form.fixedPrice" type="number" placeholder="250000" />
      </div>
    </div>

    <p class="text-xs text-foreground/60">
      Puedes usar precio por m², precio fijo o ambos si el negocio necesita ambas referencias.
    </p>

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
import { reactive, ref, watch } from 'vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';

type BranchFormValue = {
  address: string;
  city: string;
  phone: string;
  pricePerM2: string;
  fixedPrice: string;
};

const props = withDefaults(
  defineProps<{
    initialValue?: {
      address?: string;
      city?: string;
      phone?: string;
      pricePerM2?: number | null;
      fixedPrice?: number | null;
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
      city?: string;
      phone?: string;
      pricePerM2?: number;
      fixedPrice?: number;
    },
  ];
  cancel: [];
}>();

const form = reactive<BranchFormValue>({
  address: props.initialValue?.address ?? '',
  city: props.initialValue?.city ?? '',
  phone: props.initialValue?.phone ?? '',
  pricePerM2: props.initialValue?.pricePerM2?.toString() ?? '',
  fixedPrice: props.initialValue?.fixedPrice?.toString() ?? '',
});

const error = ref('');

watch(
  () => props.initialValue,
  (value) => {
    form.address = value?.address ?? '';
    form.city = value?.city ?? '';
    form.phone = value?.phone ?? '';
    form.pricePerM2 = value?.pricePerM2?.toString() ?? '';
    form.fixedPrice = value?.fixedPrice?.toString() ?? '';
    error.value = '';
  },
  { deep: true },
);

const parseNumber = (value: string) => {
  if (!value.trim()) {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const handleSubmit = () => {
  error.value = '';

  if (!form.address.trim()) {
    error.value = 'La dirección es obligatoria.';
    return;
  }

  if (!form.city.trim()) {
    error.value = 'La ciudad es obligatoria.';
    return;
  }

  const pricePerM2 = parseNumber(form.pricePerM2);
  const fixedPrice = parseNumber(form.fixedPrice);

  if (form.pricePerM2 && pricePerM2 === undefined) {
    error.value = 'El precio por m² debe ser numérico.';
    return;
  }

  if (form.fixedPrice && fixedPrice === undefined) {
    error.value = 'El precio fijo debe ser numérico.';
    return;
  }

  emit('submit', {
    address: form.address.trim(),
    city: form.city.trim() || undefined,
    phone: form.phone.trim() || undefined,
    pricePerM2,
    fixedPrice,
  });
};
</script>
