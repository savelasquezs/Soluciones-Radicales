<template>
  <aside class="hidden w-64 border-r border-border bg-card p-4 lg:block">
    <nav class="space-y-2">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
        active-class="bg-muted font-semibold"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
const items = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/clients', label: 'Clientes' },
  { to: '/services', label: 'Servicios' },
  { to: '/settings', label: 'Configuración' },
];
</script>


