<template>
  <button class="rounded-xl border border-border bg-card px-3 py-2 text-sm" @click="toggleTheme">
    <Sun v-if="theme === 'dark'" class="h-4 w-4" />
    <Moon v-else class="h-4 w-4" />
  </button>
</template>

<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next';
import { onMounted } from 'vue';
import { useTheme } from '@/shared/composables/useTheme';

const { theme, toggleTheme, init } = useTheme();

onMounted(init);
</script>