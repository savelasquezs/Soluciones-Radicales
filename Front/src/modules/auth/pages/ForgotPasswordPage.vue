<template>
  <main class="flex min-h-screen items-center justify-center bg-muted p-4">
    <AppCard class="w-full max-w-md space-y-4">
      <h1 class="text-2xl font-semibold">Recuperar contraseña</h1>
      <AppInput v-model="email" type="email" placeholder="Correo" />
      <AppButton @click="send">Enviar enlace</AppButton>
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

const email = ref('');
const message = ref('');

const send = async () => {
  await authService.forgotPassword(email.value);
  message.value = 'Si el correo existe, recibirás instrucciones.';
};
</script>