<template>
  <main class="flex min-h-screen items-center justify-center bg-muted p-4">
    <AppCard class="w-full max-w-md space-y-4">
      <h1 class="text-2xl font-semibold">Restablecer contraseña</h1>

      <p v-if="tokenError" class="text-sm text-danger">{{ tokenError }}</p>

      <form v-else class="space-y-3" @submit.prevent="onSubmit">
        <AppInput v-model="newPassword" type="password" placeholder="Nueva contraseña" />
        <AppInput v-model="confirmPassword" type="password" placeholder="Confirmar contraseña" />

        <p v-if="errorMessage" class="text-sm text-danger">{{ errorMessage }}</p>
        <p v-if="successMessage" class="text-sm text-primary">{{ successMessage }}</p>

        <AppButton type="submit" :disabled="auth.isLoading" class="w-full">
          <span v-if="!auth.isLoading">Actualizar contraseña</span>
          <AppSpinner v-else />
        </AppButton>
      </form>

      <RouterLink class="text-sm text-primary" to="/login">Volver a iniciar sesión</RouterLink>
    </AppCard>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useToast } from '@/shared/composables/useToast';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';

const route = useRoute();
const auth = useAuthStore();
const { push: pushToast } = useToast();

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''));
const tokenError = computed(() => (!token.value ? 'Token inválido o ausente.' : ''));

const newPassword = ref('');
const confirmPassword = ref('');
const successMessage = ref('');
const errorMessage = ref('');

const onSubmit = async () => {
  successMessage.value = '';
  errorMessage.value = '';

  if (!token.value) {
    errorMessage.value = 'Token inválido o ausente.';
    return;
  }

  if (!newPassword.value) {
    errorMessage.value = 'La nueva contraseña es obligatoria.';
    return;
  }

  if (newPassword.value.length < 8) {
    errorMessage.value = 'La contraseña debe tener al menos 8 caracteres.';
    return;
  }

  if (confirmPassword.value !== newPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden.';
    return;
  }

  try {
    await auth.resetPassword(token.value, newPassword.value);
    successMessage.value = 'Contraseña actualizada correctamente.';
    pushToast(successMessage.value);
  } catch (error) {
    const message = (error as { message?: string }).message ?? 'No fue posible restablecer la contraseña.';
    errorMessage.value = message;
    pushToast(message);
  }
};
</script>
