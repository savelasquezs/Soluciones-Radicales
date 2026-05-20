<template>
  <div class="min-h-screen bg-background text-foreground">
    <AppHeader context="admin" />
    <div class="flex">
      <AppSidebar />
      <main class="w-full p-4 pb-20 lg:pb-4">
        <RouterView />
      </main>
    </div>
    <AppMobileNav />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppMobileNav from '../components/AppMobileNav.vue';
</script>
