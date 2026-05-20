<template>
	<div class="relative">
		<input
			:value="props.modelValue"
			:type="inputType"
			:placeholder="props.placeholder"
			class="w-full rounded-xl border border-border bg-card px-3 py-2 pr-10 text-sm text-foreground outline-none ring-primary focus:ring-2"
			@input="
				$emit('update:modelValue', ($event.target as HTMLInputElement).value)
			"
		/>
		<button
			v-if="isPassword"
			type="button"
			class="absolute inset-y-0 right-3 flex items-center text-sm text-foreground/70 hover:text-foreground"
			@click="togglePasswordVisibility"
			:aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
		>
			<svg
				v-if="showPassword"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				class="h-5 w-5"
			>
				<path
					fill="currentColor"
					d="M12 5c-7 0-10 6.5-10 7s3 7 10 7 10-6.5 10-7-3-7-10-7Zm0 12c-3 0-5-2-5-5s2-5 5-5 5 2 5 5-2 5-5 5Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
				/>
			</svg>
			<svg
				v-else
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				class="h-5 w-5"
			>
				<path
					fill="currentColor"
					d="M12 5c-7 0-10 6.5-10 7 0 .24.08.46.2.68l1.6-1.6C4 9.83 7.12 7 12 7c1.8 0 3.43.5 4.85 1.35l1.5-1.5C16.65 5.7 14.4 5 12 5Zm9.4 3.4-2.5 2.5C19.42 11.35 20 11.98 20 12c0 .5-.18.95-.48 1.32l2.12 2.12a.75.75 0 1 1-1.06 1.06L4.25 4.66a.75.75 0 0 1 1.06-1.06L8.3 6.6C9.37 6.22 10.66 6 12 6c4.88 0 8 2.83 9.7 5.84Zm-8.7 8.7a5 5 0 0 1-6.9-6.9l1.47 1.47a3 3 0 0 0 4.93 4.93l1.5 1.5ZM12 17a5 5 0 0 0 4.9-3.5l1.5 1.5A8.93 8.93 0 0 1 12 19c-1.7 0-3.33-.4-4.78-1.12l1.6-1.6A5 5 0 0 0 12 17Z"
				/>
			</svg>
		</button>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
	modelValue?: string;
	type?: string;
	placeholder?: string;
}>();
defineEmits<{ 'update:modelValue': [value: string] }>();
const showPassword = ref(false);

const isPassword = computed(() => props.type === 'password');
const inputType = computed(() =>
	isPassword.value && showPassword.value ? 'text' : (props.type ?? 'text'),
);

const togglePasswordVisibility = () => {
	showPassword.value = !showPassword.value;
};
</script>
