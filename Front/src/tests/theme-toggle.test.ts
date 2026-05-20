import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ThemeToggle from '@/shared/components/ui/ThemeToggle.vue';

describe('ThemeToggle', () => {
  it('cambia tema', async () => {
    const wrapper = mount(ThemeToggle);
    const before = document.documentElement.classList.contains('dark');
    await wrapper.trigger('click');
    const after = document.documentElement.classList.contains('dark');
    expect(after).toBe(!before);
  });
});
