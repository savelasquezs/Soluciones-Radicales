<template>
  <div class="space-y-6">
    <section class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Clientes</h1>
        <p class="text-sm text-foreground/70">Gestiona clientes, negocios y sucursales desde una vista simple.</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="w-full sm:w-72">
          <AppInput v-model="search" placeholder="Buscar cliente por nombre" />
        </div>
        <AppButton @click="openCreateModal">Nuevo cliente</AppButton>
      </div>
    </section>

    <AppCard class="p-0">
      <div class="flex items-center justify-between border-b border-border px-4 py-3 text-sm text-foreground/65">
        <span>{{ resultLabel }}</span>
        <span v-if="searching">Buscando...</span>
      </div>

      <div v-if="isLoading" class="flex items-center justify-center gap-3 p-8 text-sm text-foreground/70">
        <AppSpinner />
        <span>Cargando clientes...</span>
      </div>

      <div v-else-if="error" class="p-8 text-center text-sm text-danger">
        {{ error }}
      </div>

      <div v-else-if="!clients.length" class="p-8 text-center text-sm text-foreground/70">
        {{ search.trim() ? 'No se encontraron clientes para esa búsqueda.' : 'Aún no hay clientes registrados.' }}
      </div>

      <div v-else>
        <div class="divide-y divide-border lg:hidden">
          <div
            v-for="client in clients"
            :key="client.id"
            class="space-y-3 px-4 py-4 transition hover:bg-surface"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium text-foreground">{{ client.name }}</p>
                <p class="text-sm text-foreground/65">{{ client.contactName || 'Sin contacto' }}</p>
              </div>
              <AppButton variant="secondary" @click="goToClient(client.id)">Ver detalle</AppButton>
            </div>
            <p class="text-sm text-foreground/60">{{ client.phone || 'Sin teléfono' }}</p>
          </div>
        </div>

        <div class="hidden lg:block">
          <AppTable>
            <thead class="bg-surface text-left text-xs uppercase tracking-wide text-foreground/60">
              <tr>
                <th class="px-4 py-3">Cliente</th>
                <th class="px-4 py-3">Contacto</th>
                <th class="px-4 py-3">Teléfono</th>
                <th class="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="client in clients" :key="client.id" class="hover:bg-surface/70">
                <td class="px-4 py-3 font-medium text-foreground">{{ client.name }}</td>
                <td class="px-4 py-3 text-foreground/70">{{ client.contactName || 'Sin contacto' }}</td>
                <td class="px-4 py-3 text-foreground/70">{{ client.phone || 'Sin teléfono' }}</td>
                <td class="px-4 py-3 text-right">
                  <AppButton variant="secondary" @click="goToClient(client.id)">
                    Ver detalle
                  </AppButton>
                </td>
              </tr>
            </tbody>
          </AppTable>
        </div>
      </div>
    </AppCard>

    <AppModal :open="isCreateModalOpen" size="lg" @close="closeCreateModal">
      <div class="space-y-5">
        <div>
          <h2 class="text-lg font-semibold text-foreground">Nuevo cliente</h2>
          <p class="text-sm text-foreground/65">Crea cliente, negocio y sucursal inicial sin salir de esta vista.</p>
        </div>

        <InitialClientForm :isSubmitting="isSubmitting" @submit="createClient" @cancel="closeCreateModal" />
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import AppTable from '@/shared/components/ui/AppTable.vue';
import { useToast } from '@/shared/composables/useToast';
import InitialClientForm from '../components/InitialClientForm.vue';
import { clientsService } from '../services/clients.service';
import type { Client, CreateInitialClientPayload } from '../types/clients.types';

const router = useRouter();
const { push: pushToast } = useToast();

const clients = ref<Client[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const error = ref('');
const search = ref('');
const searching = ref(false);
const isCreateModalOpen = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const resultLabel = computed(() => {
  if (isLoading.value) {
    return 'Cargando resultados';
  }

  const count = clients.value.length;
  return `${count} ${count === 1 ? 'cliente' : 'clientes'}`;
});

const loadClients = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    clients.value = await clientsService.listClients();
  } catch {
    error.value = 'No se pudo cargar la lista de clientes.';
  } finally {
    isLoading.value = false;
    searching.value = false;
  }
};

const searchClients = async (query: string) => {
  isLoading.value = true;
  error.value = '';
  searching.value = true;

  try {
    clients.value = query.trim()
      ? await clientsService.searchClients(query.trim())
      : await clientsService.listClients();
  } catch {
    error.value = query.trim()
      ? 'No se pudo realizar la búsqueda de clientes.'
      : 'No se pudo cargar la lista de clientes.';
  } finally {
    isLoading.value = false;
    searching.value = false;
  }
};

watch(search, (value) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    void searchClients(value);
  }, 350);
});

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});

const openCreateModal = () => {
  isCreateModalOpen.value = true;
};

const closeCreateModal = () => {
  isCreateModalOpen.value = false;
};

const createClient = async (payload: CreateInitialClientPayload) => {
  isSubmitting.value = true;
  error.value = '';

  try {
    const result = await clientsService.createInitialClient(payload);
    pushToast('Cliente creado correctamente.');
    closeCreateModal();
    if (!search.value.trim()) {
      await loadClients();
    } else {
      await searchClients(search.value);
    }
    await router.push(`/clients/${result.client.id}`);
  } catch {
    error.value = 'No se pudo crear el cliente.';
  } finally {
    isSubmitting.value = false;
  }
};

const goToClient = (id: string) => {
  void router.push(`/clients/${id}`);
};

onMounted(() => {
  void loadClients();
});
</script>




