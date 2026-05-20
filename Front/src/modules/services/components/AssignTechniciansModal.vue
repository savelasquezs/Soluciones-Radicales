<template>
  <AppModal :open="open" size="md" @close="$emit('close')">
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-foreground">Asignar técnicos</h3>

      <div v-if="loading" class="flex items-center gap-2 text-sm text-foreground/70">
        <AppSpinner />
        <span>Cargando técnicos...</span>
      </div>

      <div v-else class="space-y-2">
        <label
          v-for="technician in technicians"
          :key="technician.id"
          class="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
        >
          <input v-model="selectedIds" :value="technician.id" type="checkbox" />
          <span>{{ technician.name }}</span>
        </label>
      </div>

      <p v-if="error" class="text-sm text-danger">{{ error }}</p>

      <div class="flex justify-end gap-2">
        <AppButton variant="secondary" @click="$emit('close')">Cancelar</AppButton>
        <AppButton :disabled="submitting" @click="save">Guardar</AppButton>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import { usersService } from '@/modules/users/services/users.service';

const props = withDefaults(
  defineProps<{
    open: boolean;
    submitting?: boolean;
    modelValue?: string[];
  }>(),
  {
    submitting: false,
    modelValue: () => [],
  },
);

const emit = defineEmits<{
  close: [];
  submit: [technicianIds: string[]];
}>();

const technicians = ref<Array<{ id: string; name: string }>>([]);
const selectedIds = ref<string[]>([]);
const loading = ref(false);
const error = ref('');

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    selectedIds.value = [...props.modelValue];
    loading.value = true;
    error.value = '';
    try {
      const list = await usersService.listTechnicians();
      technicians.value = list.map((item) => ({ id: item.id, name: item.name }));
    } catch {
      error.value = 'No se pudieron cargar los técnicos.';
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

const save = () => {
  emit('submit', selectedIds.value);
};
</script>
