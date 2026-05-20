<template>
  <div class="min-h-screen bg-background text-foreground">
    <AppHeader />
    <main class="p-4">
      <RouterView />
      <div class="mt-4 flex gap-2">
        <RouterLink class="rounded-lg bg-muted px-3 py-2 text-sm" to="/technician/schedule">Mi agenda</RouterLink>
        <RouterLink class="rounded-lg bg-muted px-3 py-2 text-sm" to="/technician/profile">Perfil</RouterLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '../components/AppHeader.vue';
</script>