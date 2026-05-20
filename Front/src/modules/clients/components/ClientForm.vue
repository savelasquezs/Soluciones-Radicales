<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-2 sm:col-span-2">
        <p class="text-sm font-medium text-foreground">Nombre</p>
        <AppInput v-model="form.name" placeholder="Nombre del cliente" />
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Contacto</p>
        <AppInput v-model="form.contactName" placeholder="Nombre del contacto" />
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">Teléfono</p>
        <AppInput v-model="form.phone" placeholder="3001234567" />
      </div>
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
import { reactive, watch } from 'vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';

type ClientFormValue = {
  name: string;
  contactName: string;
  phone: string;
};

const props = withDefaults(
  defineProps<{
    initialValue?: Partial<ClientFormValue>;
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
  submit: [{ name: string; contactName: string | null; phone: string | null }];
  cancel: [];
}>();

const form = reactive<ClientFormValue>({
  name: props.initialValue?.name ?? '',
  contactName: props.initialValue?.contactName ?? '',
  phone: props.initialValue?.phone ?? '',
});

const syncForm = (value?: Partial<ClientFormValue>) => {
  form.name = value?.name ?? '';
  form.contactName = value?.contactName ?? '';
  form.phone = value?.phone ?? '';
};

watch(() => props.initialValue, syncForm, { deep: true });

const error = defineModel<string>('error', { default: '' });

const handleSubmit = () => {
  error.value = '';

  if (!form.name.trim()) {
    error.value = 'El nombre del cliente es obligatorio.';
    return;
  }
  if (form.name.trim().length < 3) {
    error.value = 'El nombre del cliente debe tener minimo 3 caracteres.';
    return;
  }
  if (form.contactName.trim() && form.contactName.trim().length < 3) {
    error.value = 'El nombre del contacto debe tener minimo 3 caracteres.';
    return;
  }

  emit('submit', {
    name: form.name.trim(),
    contactName: form.contactName.trim() || null,
    phone: form.phone.trim() || null,
  });
};
</script>
