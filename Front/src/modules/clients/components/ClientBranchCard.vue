<template>
  <article class="rounded-2xl border border-border bg-surface p-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-1">
        <p class="font-medium text-foreground">{{ item.branch.address }}</p>
        <p class="text-sm text-foreground/65">{{ item.branch.city || 'Sin ciudad' }}</p>
        <p class="text-sm text-foreground/65">{{ item.branch.phone || 'Sin telefono' }}</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <AppButton variant="secondary" @click="$emit('edit-branch', item.branch)">
          Editar sucursal
        </AppButton>
        <AppButton variant="secondary" @click="$emit('edit-config', item.branch)">
          Configuracion
        </AppButton>
        <AppButton variant="secondary" @click="openCycleEditor">
          Fechas
        </AppButton>
        <AppButton @click="$emit('history', item.branch.id)">
          Historial
        </AppButton>
      </div>
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      <div>
        <p class="text-xs uppercase tracking-wide text-foreground/55">Precio por m2</p>
        <p class="text-sm text-foreground">{{ item.branch.pricePerM2 !== null ? formatCurrencyCOP(item.branch.pricePerM2) : '-' }}</p>
      </div>
      <div>
        <p class="text-xs uppercase tracking-wide text-foreground/55">Precio fijo</p>
        <p class="text-sm text-foreground">{{ item.branch.fixedPrice !== null ? formatCurrencyCOP(item.branch.fixedPrice) : '-' }}</p>
      </div>
      <div>
        <p class="text-xs uppercase tracking-wide text-foreground/55">Frecuencia</p>
        <p class="text-sm text-foreground">{{ item.branch.frequencyDays ?? '-' }} dias</p>
      </div>
      <div>
        <p class="text-xs uppercase tracking-wide text-foreground/55">Dias de refuerzo</p>
        <p class="text-sm text-foreground">{{ item.branch.reinforcementDays ?? '-' }} dias</p>
      </div>
      <div>
        <p class="text-xs uppercase tracking-wide text-foreground/55">Refuerzo</p>
        <div class="flex gap-2 pt-1">
          <AppBadge :tone="item.branch.reinforcementEnabled ? 'success' : 'default'">
            {{ item.branch.reinforcementEnabled ? 'Habilitado' : 'Deshabilitado' }}
          </AppBadge>
          <AppBadge :tone="item.branch.reinforcementIsPaid ? 'default' : 'success'">
            {{ item.branch.reinforcementIsPaid ? 'Pago' : 'Sin costo' }}
          </AppBadge>
        </div>
      </div>
      <div>
        <p class="text-xs uppercase tracking-wide text-foreground/55">Revenue mode</p>
        <p class="text-sm text-foreground">{{ item.branch.technicianRevenueMode }}</p>
      </div>
      <div>
        <p class="text-xs uppercase tracking-wide text-foreground/55">Proximo servicio</p>
        <p class="text-sm text-foreground">{{ item.serviceCycle?.nextMainServiceDate ? formatDate(item.serviceCycle.nextMainServiceDate) : 'No programado' }}</p>
      </div>
      <div>
        <p class="text-xs uppercase tracking-wide text-foreground/55">Proximo refuerzo</p>
        <p class="text-sm text-foreground">{{ item.serviceCycle?.nextReinforcementDate ? formatDate(item.serviceCycle.nextReinforcementDate) : 'No programado' }}</p>
      </div>
    </div>

    <AppModal :open="isCycleModalOpen" size="sm" @close="closeCycleEditor">
      <div class="space-y-5">
        <div>
          <h3 class="text-lg font-semibold text-foreground">Actualizar fechas</h3>
          <p class="text-sm text-foreground/65">Define proximo servicio y refuerzo de la sucursal.</p>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">Proximo servicio principal</p>
            <AppInput v-model="nextMainDate" type="datetime-local" />
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">Proximo refuerzo</p>
            <AppInput v-model="nextReinforcementDate" type="datetime-local" />
          </div>
        </div>

        <p v-if="modalError" class="text-sm text-danger">{{ modalError }}</p>

        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="closeCycleEditor">Cancelar</AppButton>
          <AppButton @click="saveCycleDates">Guardar fechas</AppButton>
        </div>
      </div>
    </AppModal>
  </article>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import { formatCurrencyCOP } from '@/shared/helpers/currency';
import { formatDate } from '@/shared/helpers/dates';
import type { ISODateString } from '@/shared/types/common';
import type { Branch, ClientBranchDetail } from '../types/clients.types';

type BranchCycleUpdate = {
  branchId: string;
  nextMainServiceDate: ISODateString | null;
  nextReinforcementDate: ISODateString | null;
};

const props = defineProps<{
  item: ClientBranchDetail;
}>();

const emit = defineEmits<{
  'edit-branch': [branch: Branch];
  'edit-config': [branch: Branch];
  history: [branchId: string];
  'update-cycle': [payload: BranchCycleUpdate];
}>();

const isCycleModalOpen = ref(false);
const nextMainDate = ref('');
const nextReinforcementDate = ref('');
const modalError = ref('');
let reinforcementTouched = false;
let isAutoSettingReinforcement = false;

const toInputDateTime = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoOrNull = (value: string) => {
  if (!value) return null;
  return new Date(value).toISOString();
};

const addDays = (baseDateInput: string, days: number) => {
  const date = new Date(baseDateInput);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

watch(nextMainDate, (value) => {
  if (!isCycleModalOpen.value) return;
  if (reinforcementTouched) return;
  const reinforcementDays = props.item.branch.reinforcementDays ?? 0;
  if (!value) {
    isAutoSettingReinforcement = true;
    nextReinforcementDate.value = '';
    isAutoSettingReinforcement = false;
    return;
  }
  isAutoSettingReinforcement = true;
  nextReinforcementDate.value = addDays(value, reinforcementDays);
  isAutoSettingReinforcement = false;
});

const openCycleEditor = () => {
  reinforcementTouched = false;
  modalError.value = '';
  nextMainDate.value = toInputDateTime(props.item.serviceCycle?.nextMainServiceDate ?? null);
  nextReinforcementDate.value = toInputDateTime(props.item.serviceCycle?.nextReinforcementDate ?? null);

  if (nextMainDate.value && !nextReinforcementDate.value) {
    const reinforcementDays = props.item.branch.reinforcementDays ?? 0;
    isAutoSettingReinforcement = true;
    nextReinforcementDate.value = addDays(nextMainDate.value, reinforcementDays);
    isAutoSettingReinforcement = false;
  }

  isCycleModalOpen.value = true;
};

const closeCycleEditor = () => {
  isCycleModalOpen.value = false;
  modalError.value = '';
};

const saveCycleDates = () => {
  modalError.value = '';
  const mainDateIso = toIsoOrNull(nextMainDate.value);
  const reinforcementDateIso = toIsoOrNull(nextReinforcementDate.value);

  if (!mainDateIso) {
    modalError.value = 'La fecha de proximo servicio es obligatoria.';
    return;
  }

  if (reinforcementDateIso && new Date(reinforcementDateIso) < new Date(mainDateIso)) {
    modalError.value = 'La fecha de refuerzo no puede ser anterior al servicio principal.';
    return;
  }

  emit('update-cycle', {
    branchId: props.item.branch.id,
    nextMainServiceDate: mainDateIso,
    nextReinforcementDate: reinforcementDateIso,
  });

  closeCycleEditor();
};

watch(nextReinforcementDate, () => {
  if (!isCycleModalOpen.value) return;
  if (isAutoSettingReinforcement) return;
  reinforcementTouched = true;
});
</script>
