import { computed, ref } from 'vue';

const THEME_KEY = 'sr_theme';
const theme = ref<'light' | 'dark'>('light');

const applyTheme = (nextTheme: 'light' | 'dark') => {
  theme.value = nextTheme;
  document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  localStorage.setItem(THEME_KEY, nextTheme);
};

export const useTheme = () => {
  const init = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
      return;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  };

  const toggleTheme = () => applyTheme(theme.value === 'dark' ? 'light' : 'dark');

  return {
    theme: computed(() => theme.value),
    init,
    toggleTheme,
  };
};