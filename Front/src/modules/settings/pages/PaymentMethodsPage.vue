<template>
	<div class="space-y-6">
		<div
			class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
		>
			<div>
				<h1 class="text-2xl font-semibold text-foreground">Métodos de pago</h1>
				<p class="text-sm text-foreground/70">
					Administra los métodos de pago activos disponibles para registrar
					cobros.
				</p>
			</div>
			<AppButton @click="openCreateModal">Nuevo método</AppButton>
		</div>

		<AppCard>
			<p
				v-if="error"
				class="mb-4 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
			>
				{{ error }}
			</p>
			<PaymentMethodsTable
				:methods="paymentMethods"
				:loading="isLoading"
				@edit="openEditModal"
				@disable="confirmDisable"
			/>
		</AppCard>

		<AppModal :open="isModalOpen" size="md" @close="closeModal">
			<div class="space-y-4">
				<h2 class="text-xl font-semibold text-foreground">{{ modalTitle }}</h2>
				<PaymentMethodForm
					:initialValue="selectedMethod"
					:mode="modalMode"
					:loading="isSaving"
					@submit="submitMethod"
					@cancel="closeModal"
				/>
			</div>
		</AppModal>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from '@/shared/composables/useToast';
import { settingsService } from '../services/settings.service';
import type {
	CreatePaymentMethodPayload,
	PaymentMethod,
	UpdatePaymentMethodPayload,
} from '../types/settings.types';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppModal from '@/shared/components/ui/AppModal.vue';
import PaymentMethodForm from '../components/PaymentMethodForm.vue';
import PaymentMethodsTable from '../components/PaymentMethodsTable.vue';

const paymentMethods = ref<PaymentMethod[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref('');
const isModalOpen = ref(false);
const selectedMethod = ref<PaymentMethod | null>(null);
const modalMode = ref<'create' | 'edit'>('create');

const { push: pushToast } = useToast();

const loadPaymentMethods = async () => {
	error.value = '';
	isLoading.value = true;
	selectedMethod.value = null;

	try {
		paymentMethods.value = await settingsService.listPaymentMethods();
	} catch (err) {
		error.value =
			'No se pudieron cargar los métodos de pago. Intenta de nuevo.';
	} finally {
		isLoading.value = false;
	}
};

const openCreateModal = () => {
	modalMode.value = 'create';
	selectedMethod.value = null;
	isModalOpen.value = true;
};

const openEditModal = (method: PaymentMethod) => {
	modalMode.value = 'edit';
	selectedMethod.value = method;
	isModalOpen.value = true;
};

const closeModal = () => {
	isModalOpen.value = false;
	selectedMethod.value = null;
};

const submitMethod = async (
	payload: CreatePaymentMethodPayload | UpdatePaymentMethodPayload,
) => {
	isSaving.value = true;
	try {
		if (modalMode.value === 'create') {
			await settingsService.createPaymentMethod(
				payload as CreatePaymentMethodPayload,
			);
			pushToast('Método de pago creado correctamente.');
		} else if (selectedMethod.value) {
			await settingsService.updatePaymentMethod(
				selectedMethod.value.id,
				payload as UpdatePaymentMethodPayload,
			);
			pushToast('Método de pago actualizado correctamente.');
		}
		closeModal();
		await loadPaymentMethods();
	} catch (err) {
		pushToast('No se pudo guardar el método de pago.');
	} finally {
		isSaving.value = false;
	}
};

const confirmDisable = async (method: PaymentMethod) => {
	const confirmed = window.confirm(
		`¿Desactivar el método de pago "${method.name}"?`,
	);
	if (!confirmed) {
		return;
	}

	isSaving.value = true;
	try {
		await settingsService.disablePaymentMethod(method.id);
		pushToast('Método de pago desactivado correctamente.');
		await loadPaymentMethods();
	} catch (err) {
		pushToast('No se pudo desactivar el método de pago.');
	} finally {
		isSaving.value = false;
	}
};

const modalTitle = computed(() =>
	modalMode.value === 'create'
		? 'Nuevo método de pago'
		: 'Editar método de pago',
);

onMounted(loadPaymentMethods);
</script>
