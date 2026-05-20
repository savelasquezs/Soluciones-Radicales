import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage.vue';

const resetPasswordMock = vi.fn();

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
  useRoute: () => ({ query: { token: 'token-1' } }),
}));

vi.mock('@/modules/auth/stores/auth.store', () => ({
  useAuthStore: () => ({
    isLoading: false,
    resetPassword: resetPasswordMock,
  }),
}));

vi.mock('@/shared/composables/useToast', () => ({
  useToast: () => ({ push: vi.fn(), messages: [] }),
}));

describe('ResetPasswordPage', () => {
  it('valida que passwords coincidan', async () => {
    const wrapper = mount(ResetPasswordPage);
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('Password123');
    await inputs[1].setValue('Password999');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain('Las contraseñas no coinciden.');
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });
});
