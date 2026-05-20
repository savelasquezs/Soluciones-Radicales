<template>
	<form class="space-y-6" @submit.prevent="handleSubmit">
		<div class="space-y-4">
			<div class="flex items-center justify-between gap-4">
				<div>
					<p
						class="text-xs font-medium uppercase tracking-[0.2em] text-foreground/50"
					>
						Paso {{ currentStep + 1 }} de {{ steps.length }}
					</p>
					<h3 class="text-lg font-semibold text-foreground">
						{{ steps[currentStep].title }}
					</h3>
					<p class="text-sm text-foreground/65">
						{{ steps[currentStep].description }}
					</p>
				</div>
			</div>

			<div class="grid grid-cols-3 gap-2">
				<button
					v-for="(step, index) in steps"
					:key="step.key"
					type="button"
					class="h-2 rounded-full transition"
					:class="index <= currentStep ? 'bg-primary' : 'bg-border'"
					:aria-label="`Ir al paso ${index + 1}`"
					@click="goToStep(index)"
				/>
			</div>
		</div>

		<section v-show="currentStep === 0" class="space-y-4">
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2 sm:col-span-2">
					<p class="text-sm font-medium text-foreground">Nombre</p>
					<AppInput
						v-model="form.client.name"
						placeholder="Nombre del dueño"
					/>
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium text-foreground">Contacto</p>
					<AppInput
						v-model="form.client.contactName"
						placeholder="Nombre del contacto o encargado"
					/>
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium text-foreground">Teléfono</p>
					<AppInput v-model="form.client.phone" placeholder="3001234567" />
				</div>
			</div>
		</section>

		<section v-show="currentStep === 1" class="space-y-4">
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2 sm:col-span-2">
					<p class="text-sm font-medium text-foreground">Nombre del negocio</p>
					<AppInput
						v-model="form.businessName"
						placeholder="Razón social o nombre comercial"
					/>
				</div>
				<div class="space-y-2 sm:col-span-2">
					<p class="text-sm font-medium text-foreground">Dirección</p>
					<AppInput
						v-model="form.branch.address"
						placeholder="Dirección de la sucursal"
					/>
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium text-foreground">Ciudad</p>
					<AppInput v-model="form.branch.city" placeholder="Ciudad" />
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium text-foreground">Teléfono sucursal</p>
					<AppInput v-model="form.branch.phone" placeholder="3001234567" />
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium text-foreground">Precio por m²</p>
					<AppInput
						v-model="form.branch.pricePerM2"
						type="number"
						placeholder="1200"
					/>
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium text-foreground">Precio fijo</p>
					<AppInput
						v-model="form.branch.fixedPrice"
						type="number"
						placeholder="250000"
					/>
				</div>
			</div>
		</section>

		<section
			v-show="currentStep === 2"
			class="space-y-4 rounded-2xl border border-border/80 bg-surface p-4"
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<p class="text-sm font-medium text-foreground">
						Frecuencia principal
					</p>
					<AppInput
						v-model="form.branch.frequencyDays"
						type="number"
						placeholder="30"
					/>
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium text-foreground">Días para refuerzo</p>
					<AppInput
						v-model="form.branch.reinforcementDays"
						type="number"
						placeholder="10"
					/>
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium text-foreground">Refuerzo habilitado</p>
					<AppSelect
						v-model="form.branch.reinforcementEnabled"
						:options="booleanOptions"
					/>
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium text-foreground">Refuerzo pagado</p>
					<AppSelect
						v-model="form.branch.reinforcementIsPaid"
						:options="booleanOptions"
					/>
				</div>
				<div class="space-y-2 sm:col-span-2">
					<p class="text-sm font-medium text-foreground">
						Próximo servicio principal
					</p>
					<AppInput v-model="form.nextMainServiceDate" type="datetime-local" />
				</div>
			</div>

			<p class="text-xs text-foreground/60">
				Si dejas esta configuración vacía, el backend usará los valores globales
				del sistema.
			</p>
		</section>

		<p v-if="error" class="text-sm text-danger">{{ error }}</p>

		<div
			class="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex gap-2">
				<AppButton type="button" variant="secondary" @click="$emit('cancel')">
					Cancelar
				</AppButton>
				<AppButton
					v-if="currentStep > 0"
					type="button"
					variant="secondary"
					@click="goToPreviousStep"
				>
					Anterior
				</AppButton>
			</div>

			<AppButton
				v-if="currentStep < steps.length - 1"
				type="button"
				@click="goToNextStep"
			>
				Siguiente
			</AppButton>

			<AppButton v-else type="submit" :disabled="isSubmitting">
				Crear cliente
			</AppButton>
		</div>
	</form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppSelect from '@/shared/components/ui/AppSelect.vue';
import type { CreateInitialClientPayload } from '../types/clients.types';

withDefaults(
	defineProps<{
		isSubmitting?: boolean;
	}>(),
	{
		isSubmitting: false,
	},
);

const emit = defineEmits<{
	submit: [CreateInitialClientPayload];
	cancel: [];
}>();

const steps = [
	{
		key: 'client',
		title: 'Cliente',
		description: 'Datos principales de contacto para crear el registro base.',
	},
	{
		key: 'branch',
		title: 'Negocio y sucursal',
		description: 'Estructura comercial inicial y datos básicos de la sucursal.',
	},
	{
		key: 'config',
		title: 'Configuración inicial',
		description: 'Frecuencia, refuerzo y próxima visita si ya está definida.',
	},
] as const;

const currentStep = ref(0);
const form = reactive({
	client: {
		name: '',
		contactName: '',
		phone: '',
	},
	businessName: '',
	branch: {
		address: '',
		city: '',
		phone: '',
		pricePerM2: '',
		fixedPrice: '',
		frequencyDays: '',
		reinforcementDays: '',
		reinforcementEnabled: '',
		reinforcementIsPaid: '',
	},
	nextMainServiceDate: '',
});

const error = ref('');

const booleanOptions = [
	{ label: 'Usar valor global', value: '' },
	{ label: 'Sí', value: 'true' },
	{ label: 'No', value: 'false' },
];

const parseOptionalNumber = (value: string) => {
	if (!value.trim()) {
		return undefined;
	}

	const parsedValue = Number(value);
	return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const parseOptionalBoolean = (value: string) => {
	if (value === '') {
		return undefined;
	}

	return value === 'true';
};

const toIsoDate = (value: string) => {
	if (!value) {
		return undefined;
	}

	return new Date(value).toISOString();
};

const validateStep = (step: number) => {
	error.value = '';

	if (step === 0) {
		if (!form.client.name.trim()) {
			error.value = 'El nombre del cliente es obligatorio.';
			return false;
		}

		return true;
	}

	if (step === 1) {
		if (!form.businessName.trim()) {
			error.value = 'El nombre del negocio es obligatorio.';
			return false;
		}

		if (!form.branch.address.trim()) {
			error.value = 'La dirección de la sucursal es obligatoria.';
			return false;
		}

		if (!form.branch.city.trim()) {
			error.value = 'La ciudad de la sucursal es obligatoria.';
			return false;
		}

		const pricePerM2 = parseOptionalNumber(form.branch.pricePerM2);
		const fixedPrice = parseOptionalNumber(form.branch.fixedPrice);

		if (form.branch.pricePerM2 && pricePerM2 === undefined) {
			error.value = 'El precio por m² debe ser numérico.';
			return false;
		}

		if (form.branch.fixedPrice && fixedPrice === undefined) {
			error.value = 'El precio fijo debe ser numérico.';
			return false;
		}

		return true;
	}

	if (step === 2) {
		const frequencyDays = parseOptionalNumber(form.branch.frequencyDays);
		const reinforcementDays = parseOptionalNumber(
			form.branch.reinforcementDays,
		);

		if (
			form.branch.frequencyDays &&
			(frequencyDays === undefined || frequencyDays <= 0)
		) {
			error.value = 'La frecuencia debe ser mayor a 0.';
			return false;
		}

		if (
			form.branch.reinforcementDays &&
			(reinforcementDays === undefined || reinforcementDays < 0)
		) {
			error.value = 'Los días de refuerzo deben ser 0 o mayores.';
			return false;
		}

		return true;
	}

	return true;
};

const goToStep = (step: number) => {
	if (step <= currentStep.value) {
		error.value = '';
		currentStep.value = step;
		return;
	}

	for (let index = currentStep.value; index < step; index += 1) {
		if (!validateStep(index)) {
			return;
		}
	}

	currentStep.value = step;
};

const goToNextStep = () => {
	if (!validateStep(currentStep.value)) {
		return;
	}

	currentStep.value += 1;
};

const goToPreviousStep = () => {
	error.value = '';
	currentStep.value -= 1;
};

const handleSubmit = () => {
	if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
		return;
	}

	emit('submit', {
		client: {
			name: form.client.name.trim(),
			contactName: form.client.contactName.trim() || null,
			phone: form.client.phone.trim() || null,
		},
		businessName: form.businessName.trim(),
		branch: {
			address: form.branch.address.trim(),
			city: form.branch.city.trim() || undefined,
			phone: form.branch.phone.trim() || undefined,
			pricePerM2: parseOptionalNumber(form.branch.pricePerM2),
			fixedPrice: parseOptionalNumber(form.branch.fixedPrice),
			frequencyDays: parseOptionalNumber(form.branch.frequencyDays),
			reinforcementDays: parseOptionalNumber(form.branch.reinforcementDays),
			reinforcementEnabled: parseOptionalBoolean(
				form.branch.reinforcementEnabled,
			),
			reinforcementIsPaid: parseOptionalBoolean(
				form.branch.reinforcementIsPaid,
			),
		},
		nextMainServiceDate: toIsoDate(form.nextMainServiceDate),
	});
};
</script>
