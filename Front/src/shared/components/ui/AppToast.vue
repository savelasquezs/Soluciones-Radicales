<template>
  <div class="fixed right-4 top-4 z-50 flex flex-col gap-2">
    <div v-for="(message, index) in messages" :key="`${message}-${index}`" class="rounded-xl bg-foreground px-3 py-2 text-xs text-background shadow-soft">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ messages: string[] }>();
</script>