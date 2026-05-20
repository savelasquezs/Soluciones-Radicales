<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-border bg-card p-2 lg:hidden">
    <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="rounded-lg px-2 py-2 text-center text-xs hover:bg-muted">
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
const items = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/clients', label: 'Clientes' },
  { to: '/services', label: 'Servicios' },
  { to: '/settings', label: 'Config' },
];
</script>