<template>
  <main class="flex min-h-screen items-center justify-center bg-muted p-4">
    <AppCard class="w-full max-w-md space-y-4">
      <h1 class="text-2xl font-semibold">Restablecer contraseña</h1>
      <AppInput v-model="token" placeholder="Token" />
      <AppInput v-model="newPassword" type="password" placeholder="Nueva contraseña" />
      <AppButton @click="reset">Actualizar contraseña</AppButton>
      <p v-if="message" class="text-sm text-primary">{{ message }}</p>
    </AppCard>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import { authService } from '../services/auth.service';

const token = ref('');
const newPassword = ref('');
const message = ref('');

const reset = async () => {
  await authService.resetPassword(token.value, newPassword.value);
  message.value = 'Contraseña actualizada correctamente.';
};
</script>