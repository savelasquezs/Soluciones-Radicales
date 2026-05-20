<template>
  <section class="space-y-5">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <AppButton variant="secondary" @click="goBack">Volver</AppButton>
      <div class="flex flex-wrap gap-2">
        <AppButton variant="secondary" @click="isAssignModalOpen = true">Asignar técnicos</AppButton>
        <AppButton variant="secondary" @click="isRescheduleModalOpen = true">Reprogramar</AppButton>
        <AppButton variant="secondary" @click="isStatusModalOpen = true">Cambiar estado</AppButton>
        <AppButton variant="secondary" @click="isPaymentModalOpen = true">Método de pago</AppButton>
        <AppButton variant="secondary" @click="generateReinforcement">Generar refuerzo</AppButton>
        <AppButton variant="secondary" @click="isCancelModalOpen = true">Cancelar</AppButton>
      </div>
    </header>

    <AppCard v-if="isLoading" class="flex items-center gap-2 text-sm text-foreground/70">
      <AppSpinner />
      <span>Cargando detalle...</span>
    </AppCard>
    <AppCard v-else-if="error" class="text-sm text-danger">{{ error }}</AppCard>
    <template v-else>
      <ServiceDetailPanel :service="service" />
      <ServiceEvidenceList :evidences="evidences" :loading="isLoadingEvidences" />
    </template>

    <AssignTechniciansModal
      :open="isAssignModalOpen"
      :submitting="isSubmitting"
      :model-value="service?.technicians?.map((item) => item.id) ?? []"
      @close="isAssignModalOpen = false"
      @submit="assignTechnicians"
    />

    <AppModal :open="isRescheduleModalOpen" size="sm" @close="isRescheduleModalOpen = false">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Reprogramar servicio</h3>
        <AppDatePicker v-model="rescheduleDate" enableTimePicker placeholder="Nueva fecha y hora" />
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="isRescheduleModalOpen = false">Cancelar</AppButton>
          <AppButton :disabled="isSubmitting" @click="reschedule">Guardar</AppButton>
        </div>
      </div>
    </AppModal>

    <AppModal :open="isStatusModalOpen" size="sm" @close="isStatusModalOpen = false">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Cambiar estado</h3>
        <AppSelect v-model="selectedStatus" :options="statusOptions" />
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="isStatusModalOpen = false">Cancelar</AppButton>
          <AppButton :disabled="isSubmitting" @click="updateStatus">Guardar</AppButton>
        </div>
      </div>
    </AppModal>

    <AppModal :open="isPaymentModalOpen" size="sm" @close="isPaymentModalOpen = false">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Método de pago</h3>
        <AppSelect v-model="selectedPaymentMethodId" :options="paymentMethodOptions" />
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="isPaymentModalOpen = false">Cancelar</AppButton>
          <AppButton :disabled="isSubmitting" @click="updatePaymentMethod">Guardar</AppButton>
        </div>
      </div>
    </AppModal>

    <AppModal :open="isCancelModalOpen" size="sm" @close="isCancelModalOpen = false">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Cancelar servicio</h3>
        <p class="text-sm text-foreground/70">Cancelar solo en casos extremos. Esta acción cambia el estado a cancelado.</p>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="isCancelModalOpen = false">Volver</AppButton>
          <AppButton :disabled="isSubmitting" @click="cancelService">Confirmar cancelación</AppButton>
        </div>
      </div>
    </AppModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { settingsService } from '@/modules/settings/services/settings.service';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppDatePicker from '@/shared/components/ui/AppDatePicker.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import { useToast } from '@/shared/composables/useToast';
import AssignTechniciansModal from '../components/AssignTechniciansModal.vue';
import ServiceDetailPanel from '../components/ServiceDetailPanel.vue';
import ServiceEvidenceList from '../components/ServiceEvidenceList.vue';
import { servicesService } from '../services/services.service';
import type { Service, ServiceEvidence } from '../types/services.types';

const route = useRoute();
const router = useRouter();
const { push: pushToast } = useToast();

const service = ref<Service | null>(null);
const evidences = ref<ServiceEvidence[]>([]);
const paymentMethods = ref<Array<{ id: string; name: string }>>([]);

const isLoading = ref(false);
const isLoadingEvidences = ref(false);
const isSubmitting = ref(false);
const error = ref('');

const isAssignModalOpen = ref(false);
const isRescheduleModalOpen = ref(false);
const isCancelModalOpen = ref(false);
const isStatusModalOpen = ref(false);
const isPaymentModalOpen = ref(false);

const rescheduleDate = ref<Date | null>(null);
const selectedStatus = ref('');
const selectedPaymentMethodId = ref('');

const serviceId = computed(() => String(route.params.id));

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Completado', value: 'completed' },
  { label: 'Cancelado', value: 'canceled' },
  { label: 'Reprogramado', value: 'rescheduled' },
];

const paymentMethodOptions = computed(() =>
  paymentMethods.value.map((item) => ({ label: item.name, value: item.id })),
);

const loadServiceDetail = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    service.value = await servicesService.getServiceById(serviceId.value);
    selectedStatus.value = service.value.status;
    selectedPaymentMethodId.value = service.value.paymentMethodId || '';
  } catch {
    error.value = 'No se pudo cargar el detalle del servicio.';
  } finally {
    isLoading.value = false;
  }
};

const loadEvidences = async () => {
  isLoadingEvidences.value = true;
  try {
    evidences.value = await servicesService.listServiceEvidences(serviceId.value);
  } catch {
    evidences.value = [];
  } finally {
    isLoadingEvidences.value = false;
  }
};

const loadPaymentMethods = async () => {
  try {
    const data = await settingsService.listPaymentMethods();
    paymentMethods.value = data.map((item) => ({ id: item.id, name: item.name }));
  } catch {
    paymentMethods.value = [];
  }
};

const assignTechnicians = async (technicianIds: string[]) => {
  isSubmitting.value = true;
  try {
    await servicesService.assignTechniciansToService(serviceId.value, { technicianIds });
    isAssignModalOpen.value = false;
    pushToast('Técnicos asignados.');
    await loadServiceDetail();
  } catch {
    pushToast('No se pudieron asignar técnicos.');
  } finally {
    isSubmitting.value = false;
  }
};

const reschedule = async () => {
  if (!rescheduleDate.value) return;
  isSubmitting.value = true;
  try {
    await servicesService.rescheduleService(serviceId.value, { scheduledAt: rescheduleDate.value.toISOString() });
    isRescheduleModalOpen.value = false;
    pushToast('Servicio reprogramado.');
    await loadServiceDetail();
  } catch {
    pushToast('No se pudo reprogramar el servicio.');
  } finally {
    isSubmitting.value = false;
  }
};

const cancelService = async () => {
  isSubmitting.value = true;
  try {
    await servicesService.cancelService(serviceId.value);
    isCancelModalOpen.value = false;
    pushToast('Servicio cancelado.');
    await loadServiceDetail();
  } catch {
    pushToast('No se pudo cancelar el servicio.');
  } finally {
    isSubmitting.value = false;
  }
};

const updateStatus = async () => {
  if (!selectedStatus.value) return;
  isSubmitting.value = true;
  try {
    await servicesService.updateServiceStatus(serviceId.value, { status: selectedStatus.value as Service['status'] });
    isStatusModalOpen.value = false;
    pushToast('Estado actualizado.');
    await loadServiceDetail();
  } catch {
    pushToast('No se pudo actualizar el estado.');
  } finally {
    isSubmitting.value = false;
  }
};

const updatePaymentMethod = async () => {
  if (!selectedPaymentMethodId.value) return;
  isSubmitting.value = true;
  try {
    await servicesService.updateServicePayment(serviceId.value, { paymentMethodId: selectedPaymentMethodId.value });
    isPaymentModalOpen.value = false;
    pushToast('Método de pago actualizado.');
    await loadServiceDetail();
  } catch {
    pushToast('No se pudo actualizar el método de pago.');
  } finally {
    isSubmitting.value = false;
  }
};

const generateReinforcement = async () => {
  isSubmitting.value = true;
  try {
    await servicesService.generateReinforcementService(serviceId.value);
    pushToast('Refuerzo generado.');
    await loadServiceDetail();
  } catch (err) {
    const maybeMessage = (err as { message?: string }).message ?? '';
    if (maybeMessage.toLowerCase().includes('already exists')) {
      pushToast('Ya existe un refuerzo para esta sucursal y fecha.');
    } else {
      pushToast('No se pudo generar el refuerzo.');
    }
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => {
  void router.push('/services');
};

onMounted(async () => {
  await Promise.all([loadServiceDetail(), loadPaymentMethods(), loadEvidences()]);
});
</script>
