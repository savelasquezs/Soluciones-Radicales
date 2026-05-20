<template>
  <header class="flex items-center justify-between border-b border-border bg-card px-4 py-3">
    <div>
      <p class="text-sm font-semibold">Soluciones Radicales</p>
      <p v-if="auth.user" class="text-xs text-foreground/70">{{ auth.user.name }}</p>
    </div>

    <div class="flex items-center gap-2">
      <AppButton
        v-if="showModeToggle"
        variant="secondary"
        @click="toggleMode"
      >
        {{ modeLabel }}
      </AppButton>
      <ThemeToggle />
      <AppButton variant="secondary" :disabled="auth.isLoading" @click="onLogout">Salir</AppButton>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import ThemeToggle from '@/shared/components/ui/ThemeToggle.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';

const props = withDefaults(
  defineProps<{
    context?: 'admin' | 'technician';
  }>(),
  {
    context: 'admin',
  },
);

const auth = useAuthStore();
const router = useRouter();

const showModeToggle = computed(() => auth.isAdmin && auth.isTechnician);
const modeLabel = computed(() =>
  auth.preferredMode === 'admin' ? 'Modo técnico' : 'Modo admin',
);

const toggleMode = async () => {
  if (auth.preferredMode === 'admin') {
    auth.setPreferredMode('technician');
    await router.push('/technician/schedule');
    return;
  }

  auth.setPreferredMode('admin');
  await router.push('/dashboard');
};

const onLogout = async () => {
  await auth.logout();
  await router.push('/login');
};

if (showModeToggle.value) {
  if (props.context === 'technician' && auth.preferredMode !== 'technician') {
    auth.setPreferredMode('technician');
  }
  if (props.context === 'admin' && auth.preferredMode !== 'admin') {
    auth.setPreferredMode('admin');
  }
}
</script>
