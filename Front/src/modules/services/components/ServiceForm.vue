<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div class="space-y-2">
      <p class="text-sm font-medium text-foreground">Sucursal</p>
      <AppInput
        v-model="branchSearch"
        placeholder="Buscar por cliente, negocio, teléfono o dirección"
      />
      <div
        v-if="branchSearch.trim() && branchOptions.length"
        class="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border bg-background p-2"
      >
        <button
          v-for="item in branchOptions"
          :key="item.branchId"
          type="button"
          class="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-surface"
          @click="selectBranch(item)"
        >
          <p class="font-medium text-foreground">{{ item.clientName }} · {{ item.businessName }}</p>
          <p class="text-xs text-foreground/70">
            {{ item.branchAddress }}
            <span v-if="item.branchPhone"> · {{ item.branchPhone }}</span>
            <span v-if="item.clientPhone"> · Cliente: {{ item.clientPhone }}</span>
          </p>
        </button>
      </div>
      <p v-else-if="isSearchingBranches" class="text-xs text-foreground/70">Buscando sucursales...</p>
      <p v-if="selectedBranchLabel" class="text-xs text-foreground/70">{{ selectedBranchLabel }}</p>
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
import { computed, reactive, ref, watch } from 'vue';
import { clientsService } from '@/modules/clients/services/clients.service';
import type { BranchSearchItem } from '@/modules/clients/types/clients.types';
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
const branchSearch = ref('');
const branchOptions = ref<BranchSearchItem[]>([]);
const selectedBranch = ref<BranchSearchItem | null>(null);
const isSearchingBranches = ref(false);
let branchSearchTimeout: ReturnType<typeof setTimeout> | null = null;

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

const selectedBranchLabel = computed(() => {
  if (!selectedBranch.value) return '';
  return `Sucursal seleccionada: ${selectedBranch.value.clientName} · ${selectedBranch.value.businessName} · ${selectedBranch.value.branchAddress}`;
});

watch(branchSearch, (value) => {
  if (branchSearchTimeout) {
    clearTimeout(branchSearchTimeout);
  }

  const query = value.trim();
  if (!query) {
    branchOptions.value = [];
    return;
  }

  branchSearchTimeout = setTimeout(async () => {
    isSearchingBranches.value = true;
    try {
      branchOptions.value = await clientsService.searchBranches(query);
    } catch {
      branchOptions.value = [];
    } finally {
      isSearchingBranches.value = false;
    }
  }, 250);
});

const selectBranch = (item: BranchSearchItem) => {
  selectedBranch.value = item;
  form.branchId = item.branchId;
  branchSearch.value = `${item.clientName} · ${item.businessName} · ${item.branchAddress}`;
  branchOptions.value = [];
  if (item.fixedPrice !== null && item.fixedPrice !== undefined) {
    form.price = String(item.fixedPrice);
  }
};

const onSubmit = () => {
  error.value = '';
  if (!form.branchId.trim()) {
    error.value = 'Debes seleccionar una sucursal válida.';
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
