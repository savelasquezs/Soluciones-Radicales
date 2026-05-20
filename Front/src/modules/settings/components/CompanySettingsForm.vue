<template>
	<form @submit.prevent="submitForm" class="space-y-6">
		<div class="grid gap-6 sm:grid-cols-2">
			<div class="space-y-2">
				<label class="text-sm font-medium text-foreground" for="businessName"
					>Nombre del negocio</label
				>
				<AppInput
					id="businessName"
					name="businessName"
					v-model="form.businessName"
					placeholder="Nombre de la empresa"
				/>
				<p v-if="errors.businessName" class="text-sm text-danger">
					{{ errors.businessName }}
				</p>
			</div>

			<div class="space-y-2">
				<label class="text-sm font-medium text-foreground" for="logoUrl"
					>URL del logo</label
				>
				<AppInput
					id="logoUrl"
					name="logoUrl"
					v-model="form.logoUrl"
					placeholder="https://.../logo.png"
				/>
				<p class="text-sm text-foreground/70">
					La carga de archivos de logo se implementará cuando exista endpoint de
					almacenamiento. Por ahora solo se permite URL si el backend la
					soporta.
				</p>
			</div>
		</div>

		<div class="grid gap-6 sm:grid-cols-2">
			<div class="space-y-2">
				<p class="text-sm font-medium text-foreground">
					Previsualización del logo
				</p>
				<div
					v-if="form.logoUrl"
					class="overflow-hidden rounded-2xl border border-border bg-card p-3"
				>
					<img
						:src="form.logoUrl"
						alt="Logo del negocio"
						class="h-24 w-full object-contain"
						@error="logoLoadError = true"
					/>
					<p v-if="logoLoadError" class="mt-2 text-sm text-danger">
						No se pudo cargar la imagen. Revisa la URL.
					</p>
				</div>
				<div
					v-else
					class="rounded-2xl border border-border bg-card p-4 text-sm text-foreground/70"
				>
					Sin logo configurado
				</div>
			</div>
		</div>

		<div class="grid gap-6 sm:grid-cols-2">
			<div class="space-y-2">
				<label
					class="text-sm font-medium text-foreground"
					for="defaultFrequencyDays"
					>Frecuencia por defecto (días)</label
				>
				<AppInput
					id="defaultFrequencyDays"
					name="defaultFrequencyDays"
					v-model="form.defaultFrequencyDays"
					type="number"
					placeholder="30"
				/>
				<p v-if="errors.defaultFrequencyDays" class="text-sm text-danger">
					{{ errors.defaultFrequencyDays }}
				</p>
			</div>

			<div class="space-y-2">
				<label
					class="text-sm font-medium text-foreground"
					for="defaultReinforcementDays"
					>Días de refuerzo por defecto</label
				>
				<AppInput
					id="defaultReinforcementDays"
					name="defaultReinforcementDays"
					v-model="form.defaultReinforcementDays"
					type="number"
					placeholder="0"
				/>
				<p v-if="errors.defaultReinforcementDays" class="text-sm text-danger">
					{{ errors.defaultReinforcementDays }}
				</p>
			</div>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<label
				class="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
			>
				<input
					type="checkbox"
					v-model="form.reinforcementEnabledDefault"
					class="h-5 w-5 rounded border-border text-primary"
				/>
				<span class="text-sm text-foreground"
					>Habilitar refuerzo por defecto</span
				>
			</label>
			<label
				class="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
			>
				<input
					type="checkbox"
					v-model="form.reinforcementIsPaidDefault"
					class="h-5 w-5 rounded border-border text-primary"
				/>
				<span class="text-sm text-foreground"
					>Refuerzo por defecto marcado como pagado</span
				>
			</label>
		</div>

		<div
			v-if="!form.reinforcementEnabledDefault"
			class="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-foreground/80"
		>
			La configuración de refuerzo no se aplicará por defecto hasta que lo
			habilites.
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
			<AppButton
				type="button"
				variant="secondary"
				@click="handleCancel"
				:disabled="loading"
				>Restaurar</AppButton
			>
			<AppButton type="submit" :disabled="loading">Guardar cambios</AppButton>
		</div>
	</form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { SystemSettings } from '../types/settings.types';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';

const props = withDefaults(
	defineProps<{
		initialValue?: SystemSettings | null;
		loading?: boolean;
	}>(),
	{ loading: false },
);

const emits = defineEmits<{
	(e: 'submit', payload: UpdateSystemSettingsPayload): void;
	(e: 'cancel'): void;
}>();

type FormState = {
	businessName: string;
	logoUrl: string;
	defaultFrequencyDays: string;
	defaultReinforcementDays: string;
	reinforcementEnabledDefault: boolean;
	reinforcementIsPaidDefault: boolean;
};

const form = reactive<FormState>({
	businessName: '',
	logoUrl: '',
	defaultFrequencyDays: '30',
	defaultReinforcementDays: '0',
	reinforcementEnabledDefault: false,
	reinforcementIsPaidDefault: false,
});

const errors = reactive<{
	businessName?: string;
	defaultFrequencyDays?: string;
	defaultReinforcementDays?: string;
}>({});

const logoLoadError = ref(false);

const resetForm = (settings: SystemSettings | null) => {
	form.businessName = settings?.businessName ?? '';
	form.logoUrl = settings?.logoUrl ?? '';
	form.defaultFrequencyDays = String(settings?.defaultFrequencyDays ?? 30);
	form.defaultReinforcementDays = String(
		settings?.defaultReinforcementDays ?? 0,
	);
	form.reinforcementEnabledDefault =
		settings?.reinforcementEnabledDefault ?? false;
	form.reinforcementIsPaidDefault =
		settings?.reinforcementIsPaidDefault ?? false;
	logoLoadError.value = false;
	errors.businessName = undefined;
	errors.defaultFrequencyDays = undefined;
	errors.defaultReinforcementDays = undefined;
};

watch(
	() => props.initialValue,
	(value) => {
		if (value) {
			resetForm(value);
		}
	},
	{ immediate: true },
);

const validateForm = () => {
	errors.businessName = undefined;
	errors.defaultFrequencyDays = undefined;
	errors.defaultReinforcementDays = undefined;

	if (!form.businessName.trim()) {
		errors.businessName = 'businessName es requerido.';
	} else if (form.businessName.trim().length < 3) {
		errors.businessName = 'businessName debe tener al menos 3 caracteres.';
	}

	const frequency = Number(form.defaultFrequencyDays);
	if (
		!form.defaultFrequencyDays.trim() ||
		Number.isNaN(frequency) ||
		frequency <= 0
	) {
		errors.defaultFrequencyDays =
			'defaultFrequencyDays debe ser un número mayor a 0.';
	}

	const reinforcementDays = Number(form.defaultReinforcementDays);
	if (
		form.defaultReinforcementDays.trim() === '' ||
		Number.isNaN(reinforcementDays) ||
		reinforcementDays < 0
	) {
		errors.defaultReinforcementDays =
			'defaultReinforcementDays debe ser un número mayor o igual a 0.';
	}

	if (form.reinforcementEnabledDefault && reinforcementDays <= 0) {
		errors.defaultReinforcementDays =
			'Si el refuerzo está habilitado, los días deben ser mayores a 0.';
	}

	return (
		!errors.businessName &&
		!errors.defaultFrequencyDays &&
		!errors.defaultReinforcementDays
	);
};

const submitForm = () => {
	if (!validateForm()) {
		return;
	}

	emits('submit', {
		businessName: form.businessName.trim(),
		logoUrl: form.logoUrl.trim() === '' ? null : form.logoUrl.trim(),
		defaultFrequencyDays: Number(form.defaultFrequencyDays),
		defaultReinforcementDays: Number(form.defaultReinforcementDays),
		reinforcementEnabledDefault: form.reinforcementEnabledDefault,
		reinforcementIsPaidDefault: form.reinforcementIsPaidDefault,
	});
};

const handleCancel = () => {
	resetForm(props.initialValue ?? null);
	emits('cancel');
};

type UpdateSystemSettingsPayload = {
	businessName: string;
	logoUrl?: string | null;
	defaultFrequencyDays: number;
	defaultReinforcementDays: number;
	reinforcementEnabledDefault: boolean;
	reinforcementIsPaidDefault: boolean;
};
</script>
