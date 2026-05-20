<template>
  <RouterView />
  <AppToast :messages="messages" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { useToast } from '@/shared/composables/useToast';
import AppToast from '@/shared/components/ui/AppToast.vue';

const auth = useAuthStore();
const { messages } = useToast();

onMounted(async () => {
  await auth.bootstrapSession();
});
</script>
