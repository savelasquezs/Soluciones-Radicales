<template>
  <main class="flex min-h-screen items-center justify-center bg-muted p-4">
    <AppCard class="w-full max-w-md space-y-4">
      <h1 class="text-2xl font-semibold">Iniciar sesión</h1>
      <form class="space-y-3" @submit.prevent="onSubmit">
        <AppInput v-model="email" type="email" placeholder="Correo" />
        <AppInput v-model="password" type="password" placeholder="Contraseña" />
        <AppButton type="submit" :disabled="loading" class="w-full">
          <span v-if="!loading">Entrar</span>
          <AppSpinner v-else />
        </AppButton>
      </form>
      <RouterLink class="text-sm text-primary" to="/forgot-password">¿Olvidaste la contraseña?</RouterLink>
      <p v-if="errorMessage" class="text-sm text-danger">{{ errorMessage }}</p>
    </AppCard>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const onSubmit = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    await auth.login(email.value, password.value);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
    await router.push(redirect);
  } catch (error: any) {
    errorMessage.value = error?.message ?? 'Error de autenticación';
  } finally {
    loading.value = false;
  }
};
</script>