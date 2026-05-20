<template>
  <header class="flex items-center justify-between border-b border-border bg-card px-4 py-3">
    <h1 class="text-sm font-semibold">Soluciones Radicales</h1>
    <div class="flex items-center gap-2">
      <ThemeToggle />
      <AppButton variant="secondary" @click="onLogout">Salir</AppButton>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import ThemeToggle from '@/shared/components/ui/ThemeToggle.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const auth = useAuthStore();
const router = useRouter();

const onLogout = async () => {
  await auth.logout();
  await router.push('/login');
};
</script>