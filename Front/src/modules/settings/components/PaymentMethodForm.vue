<template>
	<form @submit.prevent="submitForm" class="space-y-6">
		<div class="space-y-4">
			<div class="space-y-2">
				<label
					class="text-sm font-medium text-foreground"
					for="paymentMethodName"
					>Nombre</label
				>
				<AppInput
					id="paymentMethodName"
					name="paymentMethodName"
					v-model="form.name"
					placeholder="Nombre del método"
				/>
				<p v-if="errors.name" class="text-sm text-danger">{{ errors.name }}</p>
			</div>

			<div class="space-y-2">
				<label
					class="text-sm font-medium text-foreground"
					for="paymentMethodType"
					>Tipo</label
				>
				<AppSelect
					id="paymentMethodType"
					name="paymentMethodType"
					v-model="form.type"
					:options="paymentMethodTypeOptions"
				/>
				<p v-if="errors.type" class="text-sm text-danger">{{ errors.type }}</p>
			</div>

			<label
				class="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
			>
				<input
					type="checkbox"
					v-model="form.active"
					class="h-5 w-5 rounded border-border text-primary"
				/>
				<span class="text-sm text-foreground">Activo</span>
			</label>
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
			<AppButton
				type="button"
				variant="secondary"
				@click="emitCancel"
				:disabled="loading"
				>Cancelar</AppButton
			>
			<AppButton type="submit" :disabled="loading">{{ submitLabel }}</AppButton>
		</div>
	</form>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type {
	CreatePaymentMethodPayload,
	PaymentMethod,
	UpdatePaymentMethodPayload,
} from '../types/settings.types';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';

const paymentMethodTypeOptions = [
	{ value: 'cash', label: 'Efectivo' },
	{ value: 'bank', label: 'Banco' },
	{ value: 'other', label: 'Otro' },
] as Array<{ label: string; value: string }>;

type PaymentMethodTypeOption = 'cash' | 'bank' | 'other';

const props = withDefaults(
	defineProps<{
		initialValue?: PaymentMethod | null;
		mode: 'create' | 'edit';
		loading?: boolean;
	}>(),
	{ loading: false },
);

const emits = defineEmits<{
	(
		e: 'submit',
		payload: CreatePaymentMethodPayload | UpdatePaymentMethodPayload,
	): void;
	(e: 'cancel'): void;
}>();

type FormState = {
	name: string;
	type: PaymentMethodTypeOption;
	active: boolean;
};

const form = reactive<FormState>({
	name: '',
	type: 'cash',
	active: true,
});

const errors = reactive<{ name?: string; type?: string }>({});

const resetForm = (method?: PaymentMethod | null) => {
	form.name = method?.name ?? '';
	form.type = (method?.type as PaymentMethodTypeOption) ?? 'cash';
	form.active = method?.active ?? true;
	errors.name = undefined;
	errors.type = undefined;
};

watch(
	() => props.initialValue,
	(value) => {
		resetForm(value ?? null);
	},
	{ immediate: true },
);

const submitLabel = computed(() =>
	props.mode === 'create' ? 'Crear método' : 'Guardar cambios',
);

const validateForm = () => {
	errors.name = undefined;
	errors.type = undefined;

	if (!form.name.trim()) {
		errors.name = 'El nombre es requerido.';
	} else if (form.name.trim().length < 3) {
		errors.name = 'El nombre debe tener al menos 3 caracteres.';
	}

	if (!form.type) {
		errors.type = 'El tipo es requerido.';
	}

	return !errors.name && !errors.type;
};

const submitForm = () => {
	if (!validateForm()) {
		return;
	}

	const payload = {
		name: form.name.trim(),
		type: form.type,
		active: form.active,
	} as const;

	emits('submit', payload);
};

const emitCancel = () => {
	emits('cancel');
};
</script>
