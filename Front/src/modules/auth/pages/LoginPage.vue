<template>
  <main class="flex min-h-screen items-center justify-center bg-muted p-4">
    <AppCard class="w-full max-w-md space-y-4">
      <h1 class="text-2xl font-semibold">Iniciar sesión</h1>

      <form class="space-y-3" @submit.prevent="onSubmit">
        <AppInput v-model="email" type="email" placeholder="Correo" />
        <AppInput v-model="password" type="password" placeholder="Contraseña" />

        <p v-if="errorMessage" class="text-sm text-danger">{{ errorMessage }}</p>

        <AppButton type="submit" :disabled="auth.isLoading" class="w-full">
          <span v-if="!auth.isLoading">Entrar</span>
          <AppSpinner v-else />
        </AppButton>
      </form>

      <RouterLink class="text-sm text-primary" to="/forgot-password">
        ¿Olvidaste la contraseña?
      </RouterLink>
    </AppCard>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useToast } from '@/shared/composables/useToast';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppInput from '@/shared/components/ui/AppInput.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const { push: pushToast } = useToast();

const email = ref('');
const password = ref('');
const errorMessage = ref('');

const onSubmit = async () => {
  errorMessage.value = '';

  if (!email.value.trim()) {
    errorMessage.value = 'El correo es obligatorio.';
    return;
  }

  if (!password.value.trim()) {
    errorMessage.value = 'La contraseña es obligatoria.';
    return;
  }

  try {
    await auth.login(email.value, password.value);

    const rawRedirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
    const forbidden = ['/login', '/forgot-password', '/reset-password'];

    const isValidRedirect = (r: string) => {
      if (!r) return false;
      try {
        // only allow internal paths
        if (!r.startsWith('/')) return false;
        // ignore forbidden targets
        if (forbidden.includes(r)) return false;
        return true;
      } catch (_e) {
        return false;
      }
    };

    const destination = isValidRedirect(rawRedirect) ? rawRedirect : auth.resolveHomePath();
    await router.replace(destination);
  } catch (error) {
    const message = (error as { message?: string }).message ?? 'Error de autenticación.';
    errorMessage.value = message;
    pushToast(message);
  }
};
</script>
