<template>
  <main class="flex min-h-screen items-center justify-center bg-muted p-4">
    <AppCard class="w-full max-w-md space-y-4">
      <h1 class="text-2xl font-semibold">Recuperar contraseña</h1>

      <form class="space-y-3" @submit.prevent="onSubmit">
        <AppInput v-model="email" type="email" placeholder="Correo" />

        <p v-if="errorMessage" class="text-sm text-danger">{{ errorMessage }}</p>
        <p v-if="successMessage" class="text-sm text-primary">{{ successMessage }}</p>

        <AppButton type="submit" :disabled="auth.isLoading" class="w-full">
          <span v-if="!auth.isLoading">Enviar enlace</span>
          <AppSpinner v-else />
        </AppButton>
      </form>

      <RouterLink class="text-sm text-primary" to="/login">Volver a iniciar sesión</RouterLink>
    </AppCard>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { useToast } from '@/shared/composables/useToast';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';

const auth = useAuthStore();
const { push: pushToast } = useToast();

const email = ref('');
const successMessage = ref('');
const errorMessage = ref('');

const onSubmit = async () => {
  successMessage.value = '';
  errorMessage.value = '';

  if (!email.value.trim()) {
    errorMessage.value = 'El correo es obligatorio.';
    return;
  }

  try {
    await auth.forgotPassword(email.value.trim());
    successMessage.value = 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.';
    pushToast(successMessage.value);
  } catch (error) {
    const message = (error as { message?: string }).message ?? 'No fue posible procesar la solicitud.';
    errorMessage.value = message;
    pushToast(message);
  }
};
</script>
