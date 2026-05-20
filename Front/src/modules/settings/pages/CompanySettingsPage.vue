<template>
	<div class="space-y-6">
		<div
			class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
		>
			<div>
				<h1 class="text-2xl font-semibold text-foreground">
					Configuración de empresa
				</h1>
				<p class="text-sm text-foreground/70">
					Edita la identidad de la empresa y los valores operativos por defecto.
				</p>
			</div>
		</div>

		<AppCard>
			<div
				v-if="isLoading"
				class="flex items-center gap-3 text-sm text-foreground/70"
			>
				<AppSpinner />
				Cargando configuración...
			</div>

			<div v-else>
				<p
					v-if="error"
					class="mb-4 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
				>
					{{ error }}
				</p>
				<CompanySettingsForm
					v-if="settings"
					:initialValue="settings"
					:loading="isSaving"
					@submit="handleSave"
					@cancel="handleCancel"
				/>
			</div>
		</AppCard>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from '@/shared/composables/useToast';
import { settingsService } from '../services/settings.service';
import type {
	SystemSettings,
	UpdateSystemSettingsPayload,
} from '../types/settings.types';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import CompanySettingsForm from '../components/CompanySettingsForm.vue';

const settings = ref<SystemSettings | null>(null);
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref('');

const { push: pushToast } = useToast();

const loadSettings = async () => {
	error.value = '';
	isLoading.value = true;

	try {
		settings.value = await settingsService.getSettings();
	} catch (err) {
		error.value = 'No se pudo cargar la configuración. Intenta de nuevo.';
	} finally {
		isLoading.value = false;
	}
};

const handleSave = async (payload: UpdateSystemSettingsPayload) => {
	isSaving.value = true;
	try {
		const updated = await settingsService.updateSettings(payload);
		settings.value = updated;
		pushToast('Configuración actualizada correctamente.');
	} catch (err) {
		pushToast('No se pudo guardar la configuración.');
	} finally {
		isSaving.value = false;
	}
};

const handleCancel = () => {
	if (settings.value) {
		// El formulario se restablece automáticamente desde el prop.
	}
};

onMounted(loadSettings);
</script>
