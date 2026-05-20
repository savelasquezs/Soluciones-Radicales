<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div class="space-y-2">
      <p class="text-sm font-medium text-foreground">Sucursal (branchId)</p>
      <AppInput v-model="form.branchId" placeholder="branch-id" />
    </div>

    <div class="space-y-2">
      <p class="text-sm font-medium text-foreground">Fecha y hora</p>
      <AppDatePicker v-model="form.scheduledAt" enableTimePicker placeholder="Selecciona fecha y hora" />
    </div>

    <div class="space-y-2">
      <p class="text-sm font-medium text-foreground">Tipo</p>
      <AppSelect v-model="form.type" :options="typeOptions" />
    </div>

    <div class="space-y-2">
      <p class="text-sm font-medium text-foreground">Precio</p>
      <AppInput v-model="form.price" type="number" placeholder="250000" />
    </div>

    <div class="space-y-2">
      <p class="text-sm font-medium text-foreground">Estado (opcional)</p>
      <AppSelect v-model="form.status" :options="statusOptions" />
    </div>

    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <div class="flex justify-end gap-2">
      <AppButton type="button" variant="secondary" @click="$emit('cancel')">Cancelar</AppButton>
      <AppButton type="submit" :disabled="submitting">Guardar</AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppDatePicker from '@/shared/components/ui/AppDatePicker.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import type { CreateServicePayload } from '../types/services.types';

const props = withDefaults(
  defineProps<{
    submitting?: boolean;
    initialScheduledAt?: string | null;
  }>(),
  {
    submitting: false,
    initialScheduledAt: null,
  },
);

const emit = defineEmits<{
  submit: [payload: CreateServicePayload];
  cancel: [];
}>();

const form = reactive({
  branchId: '',
  scheduledAt: props.initialScheduledAt ? new Date(props.initialScheduledAt) : null as Date | null,
  type: 'main',
  price: '',
  status: '',
});

const error = ref('');

const typeOptions = [
  { label: 'Principal', value: 'main' },
  { label: 'Refuerzo', value: 'reinforcement' },
];

const statusOptions = [
  { label: 'Sin definir', value: '' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Completado', value: 'completed' },
  { label: 'Cancelado', value: 'canceled' },
  { label: 'Reprogramado', value: 'rescheduled' },
];

const onSubmit = () => {
  error.value = '';
  if (!form.branchId.trim()) {
    error.value = 'El branchId es obligatorio.';
    return;
  }

  if (!form.scheduledAt) {
    error.value = 'La fecha y hora son obligatorias.';
    return;
  }

  const price = form.price.trim() ? Number(form.price) : undefined;
  if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
    error.value = 'El precio debe ser un número válido.';
    return;
  }

  emit('submit', {
    branchId: form.branchId.trim(),
    scheduledAt: form.scheduledAt.toISOString(),
    type: form.type as 'main' | 'reinforcement',
    status: (form.status || undefined) as CreateServicePayload['status'],
    price,
  });
};
</script>
