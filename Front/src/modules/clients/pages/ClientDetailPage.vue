<template>
  <div class="space-y-6">
    <section class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Detalle del cliente</h1>
        <p class="text-sm text-foreground/70">Consulta la estructura del cliente y administra su operación por sucursal.</p>
      </div>
      <AppButton variant="secondary" @click="goBack">Volver</AppButton>
    </section>

    <AppCard v-if="isLoading" class="flex items-center justify-center gap-3 p-8 text-sm text-foreground/70">
      <AppSpinner />
      <span>Cargando cliente...</span>
    </AppCard>

    <AppCard v-else-if="error" class="p-8 text-center text-sm text-danger">
      {{ error }}
    </AppCard>

    <template v-else-if="detail">
      <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <AppCard class="space-y-4">
          <div class="space-y-1">
            <p class="text-xs uppercase tracking-wide text-foreground/60">Cliente</p>
            <h2 class="text-xl font-semibold text-foreground">{{ detail.client.name }}</h2>
            <p class="text-sm text-foreground/70">{{ detail.client.contactName || 'Sin contacto principal' }}</p>
            <p class="text-sm text-foreground/70">{{ detail.client.phone || 'Sin teléfono registrado' }}</p>
          </div>
        </AppCard>

        <div class="flex flex-wrap gap-2 lg:justify-end">
          <AppButton variant="secondary" @click="openEditClientModal">Editar cliente</AppButton>
          <AppButton @click="openAddBusinessModal">Agregar negocio</AppButton>
        </div>
      </section>

      <section v-if="detail.businesses.length" class="space-y-5">
        <AppCard
          v-for="entry in detail.businesses"
          :key="entry.business.id"
          class="space-y-5"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-1">
              <p class="text-xs uppercase tracking-wide text-foreground/60">Negocio</p>
              <h3 class="text-lg font-semibold text-foreground">{{ entry.business.name }}</h3>
              <p class="text-sm text-foreground/60">{{ entry.branches.length }} {{ entry.branches.length === 1 ? 'sucursal' : 'sucursales' }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <AppButton variant="secondary" @click="openEditBusinessModal(entry.business)">
                Editar negocio
              </AppButton>
              <AppButton @click="openAddBranchModal(entry.business)">
                Agregar sucursal
              </AppButton>
            </div>
          </div>

          <div v-if="entry.branches.length" class="grid gap-4 xl:grid-cols-2">
            <ClientBranchCard
              v-for="item in entry.branches"
              :key="item.branch.id"
              :item="item"
              @edit-branch="openEditBranchModal"
              @edit-config="openEditBranchConfigModal"
              @history="goToHistory"
              @update-cycle="updateBranchCycleDates"
            />
          </div>

          <div v-else class="rounded-2xl border border-dashed border-border p-6 text-sm text-foreground/70">
            Este negocio aún no tiene sucursales.
          </div>
        </AppCard>
      </section>

      <AppCard v-else class="p-8 text-center text-sm text-foreground/70">
        Este cliente aún no tiene negocios registrados.
      </AppCard>
    </template>

    <AppModal :open="isEditClientModal" size="md" @close="closeEditClientModal">
      <div class="space-y-5">
        <div>
          <h2 class="text-lg font-semibold text-foreground">Editar cliente</h2>
          <p class="text-sm text-foreground/65">Actualiza nombre, contacto y teléfono principal.</p>
        </div>
        <ClientForm
          :initialValue="clientFormInitialValue"
          submitLabel="Guardar cliente"
          :isSubmitting="isSubmitting"
          @submit="updateClient"
          @cancel="closeEditClientModal"
        />
      </div>
    </AppModal>

    <AppModal :open="isBusinessModalOpen" size="sm" @close="closeBusinessModal">
      <div class="space-y-5">
        <div>
          <h2 class="text-lg font-semibold text-foreground">{{ selectedBusiness ? 'Editar negocio' : 'Nuevo negocio' }}</h2>
          <p class="text-sm text-foreground/65">Mantén la estructura comercial del cliente organizada.</p>
        </div>
        <BusinessForm
          :initialValue="businessFormInitialValue"
          submitLabel="Guardar negocio"
          :isSubmitting="isSubmitting"
          @submit="handleBusinessSubmit"
          @cancel="closeBusinessModal"
        />
      </div>
    </AppModal>

    <AppModal :open="isBranchModalOpen" size="md" @close="closeBranchModal">
      <div class="space-y-5">
        <div>
          <h2 class="text-lg font-semibold text-foreground">{{ selectedBranch ? 'Editar sucursal' : 'Nueva sucursal' }}</h2>
          <p class="text-sm text-foreground/65">Gestiona datos básicos y valores comerciales de la sucursal.</p>
        </div>
        <BranchForm
          :initialValue="branchFormInitialValue"
          submitLabel="Guardar sucursal"
          :isSubmitting="isSubmitting"
          @submit="handleBranchSubmit"
          @cancel="closeBranchModal"
        />
      </div>
    </AppModal>

    <AppModal :open="isConfigModalOpen" size="md" @close="closeBranchConfigModal">
      <div class="space-y-5">
        <div>
          <h2 class="text-lg font-semibold text-foreground">Configuración de sucursal</h2>
          <p class="text-sm text-foreground/65">Controla frecuencia, refuerzos y atribución por técnico.</p>
        </div>
        <BranchConfigurationForm
          v-if="branchConfigurationInitialValue"
          :initialValue="branchConfigurationInitialValue"
          submitLabel="Guardar configuración"
          :isSubmitting="isSubmitting"
          @submit="updateBranchConfiguration"
          @cancel="closeBranchConfigModal"
        />
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import { useToast } from '@/shared/composables/useToast';
import ClientBranchCard from '../components/ClientBranchCard.vue';
import BranchConfigurationForm from '../components/BranchConfigurationForm.vue';
import BranchForm from '../components/BranchForm.vue';
import BusinessForm from '../components/BusinessForm.vue';
import ClientForm from '../components/ClientForm.vue';
import { clientsService } from '../services/clients.service';
import type {
  Branch,
  Business,
  ClientDetail,
  ServiceCycle,
  UpdateBranchConfigurationPayload,
  UpdateBranchPayload,
} from '../types/clients.types';

const route = useRoute();
const router = useRouter();
const { push: pushToast } = useToast();

const detail = ref<ClientDetail | null>(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const error = ref('');
const selectedBusiness = ref<Business | null>(null);
const selectedBranch = ref<Branch | null>(null);
const isEditClientModal = ref(false);
const isBusinessModalOpen = ref(false);
const isBranchModalOpen = ref(false);
const isConfigModalOpen = ref(false);

const clientId = computed(() => String(route.params.id));

const clientFormInitialValue = computed(() => ({
  name: detail.value?.client.name ?? '',
  contactName: detail.value?.client.contactName ?? '',
  phone: detail.value?.client.phone ?? '',
}));

const businessFormInitialValue = computed(() => {
  if (!selectedBusiness.value) {
    return undefined;
  }

  return { name: selectedBusiness.value.name };
});

const branchFormInitialValue = computed(() => {
  if (!selectedBranch.value) {
    return undefined;
  }

  return {
    address: selectedBranch.value.address,
    city: selectedBranch.value.city ?? '',
    phone: selectedBranch.value.phone ?? '',
    pricePerM2: selectedBranch.value.pricePerM2,
    fixedPrice: selectedBranch.value.fixedPrice,
  };
});

const branchConfigurationInitialValue = computed(() => {
  if (!selectedBranch.value) {
    return undefined;
  }

  return {
    frequencyDays: selectedBranch.value.frequencyDays ?? 0,
    reinforcementDays: selectedBranch.value.reinforcementDays ?? 0,
    reinforcementEnabled: selectedBranch.value.reinforcementEnabled ?? false,
    reinforcementIsPaid: selectedBranch.value.reinforcementIsPaid ?? false,
    technicianRevenueMode: selectedBranch.value.technicianRevenueMode,
  };
});

const loadDetail = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    detail.value = await clientsService.getClientDetail(clientId.value);
  } catch {
    error.value = 'No se pudo cargar el detalle del cliente.';
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  void router.push('/clients');
};

const openEditClientModal = () => {
  isEditClientModal.value = true;
};

const closeEditClientModal = () => {
  isEditClientModal.value = false;
};

const openAddBusinessModal = () => {
  selectedBusiness.value = null;
  isBusinessModalOpen.value = true;
};

const openEditBusinessModal = (business: Business) => {
  selectedBusiness.value = business;
  isBusinessModalOpen.value = true;
};

const closeBusinessModal = () => {
  isBusinessModalOpen.value = false;
  selectedBusiness.value = null;
};

const openAddBranchModal = (business: Business) => {
  selectedBusiness.value = business;
  selectedBranch.value = null;
  isBranchModalOpen.value = true;
};

const openEditBranchModal = (branch: Branch) => {
  selectedBranch.value = branch;
  isBranchModalOpen.value = true;
};

const closeBranchModal = () => {
  isBranchModalOpen.value = false;
  selectedBranch.value = null;
};

const openEditBranchConfigModal = (branch: Branch) => {
  selectedBranch.value = branch;
  isConfigModalOpen.value = true;
};

const closeBranchConfigModal = () => {
  isConfigModalOpen.value = false;
  selectedBranch.value = null;
};

const refreshDetail = async (message: string, onClose: () => void) => {
  pushToast(message);
  onClose();
  await loadDetail();
};

const updateClient = async (payload: { name: string; contactName: string | null; phone: string | null }) => {
  if (!detail.value) {
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    await clientsService.updateClient(detail.value.client.id, {
      name: payload.name,
      contactName: payload.contactName ?? undefined,
      phone: payload.phone ?? undefined,
    });
    await refreshDetail('Cliente actualizado.', closeEditClientModal);
  } catch {
    error.value = 'No se pudo actualizar el cliente.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleBusinessSubmit = async (payload: { name: string }) => {
  if (!detail.value) {
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    if (selectedBusiness.value) {
      await clientsService.updateBusiness(selectedBusiness.value.id, payload);
      await refreshDetail('Negocio actualizado.', closeBusinessModal);
      return;
    }

    await clientsService.addBusinessToClient(detail.value.client.id, payload);
    await refreshDetail('Negocio agregado.', closeBusinessModal);
  } catch {
    error.value = selectedBusiness.value
      ? 'No se pudo actualizar el negocio.'
      : 'No se pudo agregar el negocio.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleBranchSubmit = async (payload: UpdateBranchPayload) => {
  isSubmitting.value = true;
  error.value = '';

  try {
    if (selectedBranch.value) {
      await clientsService.updateBranch(selectedBranch.value.id, payload);
      await refreshDetail('Sucursal actualizada.', closeBranchModal);
      return;
    }

    if (!selectedBusiness.value || !detail.value) {
      return;
    }

    await clientsService.addBranchToBusiness(selectedBusiness.value.id, {
      clientId: detail.value.client.id,
      ...payload,
    });
    await refreshDetail('Sucursal agregada.', closeBranchModal);
  } catch {
    error.value = selectedBranch.value
      ? 'No se pudo actualizar la sucursal.'
      : 'No se pudo agregar la sucursal.';
  } finally {
    isSubmitting.value = false;
  }
};

const updateBranchConfiguration = async (payload: UpdateBranchConfigurationPayload) => {
  if (!selectedBranch.value) {
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  try {
    await clientsService.updateBranchConfiguration(selectedBranch.value.id, payload);
    await refreshDetail('Configuración de sucursal actualizada.', closeBranchConfigModal);
  } catch {
    error.value = 'No se pudo guardar la configuración de la sucursal.';
  } finally {
    isSubmitting.value = false;
  }
};

const goToHistory = (branchId: string) => {
  void router.push(`/clients/${clientId.value}/branches/${branchId}/history`);
};

const updateBranchCycleDates = (payload: {
  branchId: string;
  nextMainServiceDate: string | null;
  nextReinforcementDate: string | null;
}) => {
  if (!detail.value) {
    return;
  }

  detail.value = {
    ...detail.value,
    businesses: detail.value.businesses.map((businessItem) => ({
      ...businessItem,
      branches: businessItem.branches.map((branchItem) => {
        if (branchItem.branch.id !== payload.branchId) {
          return branchItem;
        }

        const cycle: ServiceCycle = branchItem.serviceCycle
          ? {
              ...branchItem.serviceCycle,
              nextMainServiceDate: payload.nextMainServiceDate,
              nextReinforcementDate: payload.nextReinforcementDate,
            }
          : {
              id: `local-${payload.branchId}`,
              branchId: payload.branchId,
              active: true,
              lastMainServiceDate: null,
              nextMainServiceDate: payload.nextMainServiceDate,
              nextReinforcementDate: payload.nextReinforcementDate,
            };

        return {
          ...branchItem,
          serviceCycle: cycle,
        };
      }),
    })),
  };

  pushToast('Fechas actualizadas en vista local. Pendiente endpoint para persistir en backend.');
};

onMounted(() => {
  void loadDetail();
});
</script>


