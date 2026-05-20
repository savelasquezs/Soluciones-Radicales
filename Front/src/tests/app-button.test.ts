import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AppButton from '@/shared/components/ui/AppButton.vue';

describe('AppButton', () => {
  it('renderiza y emite click', async () => {
    const wrapper = mount(AppButton, { slots: { default: 'Click' } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
