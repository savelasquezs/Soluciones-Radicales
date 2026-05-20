<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="space-y-2">
      <p class="text-sm font-medium text-foreground">Nombre del negocio</p>
      <AppInput v-model="name" placeholder="Razón social o nombre comercial" />
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
import { ref, watch } from 'vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';

const props = withDefaults(
  defineProps<{
    initialValue?: { name?: string };
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
  submit: [{ name: string }];
  cancel: [];
}>();

const name = ref(props.initialValue?.name ?? '');
const error = ref('');

watch(
  () => props.initialValue,
  (value) => {
    name.value = value?.name ?? '';
    error.value = '';
  },
  { deep: true },
);

const handleSubmit = () => {
  error.value = '';

  if (!name.value.trim()) {
    error.value = 'El nombre del negocio es obligatorio.';
    return;
  }
  if (name.value.trim().length < 3) {
    error.value = 'El nombre del negocio debe tener minimo 3 caracteres.';
    return;
  }

  emit('submit', { name: name.value.trim() });
};
</script>
