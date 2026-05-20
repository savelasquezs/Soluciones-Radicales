<template>
  <div class="min-h-screen bg-background text-foreground">
    <AppHeader context="technician" />
    <main class="mx-auto w-full max-w-5xl p-4 pb-20">
      <RouterView />
    </main>
    <nav class="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2 border-t border-border bg-card p-2 lg:hidden">
      <RouterLink
        to="/technician/schedule"
        class="rounded-lg px-2 py-2 text-center text-xs"
        active-class="bg-muted font-semibold"
      >
        Mi agenda
      </RouterLink>
      <RouterLink
        to="/technician/profile"
        class="rounded-lg px-2 py-2 text-center text-xs"
        active-class="bg-muted font-semibold"
      >
        Perfil
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '../components/AppHeader.vue';
</script>
