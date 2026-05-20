import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage.vue';

const resetPasswordMock = vi.fn();
const routeState: { query: Record<string, unknown> } = { query: { token: 'token-1' } };

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
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
    routeState.query = { token: 'token-1' };
    const wrapper = mount(ResetPasswordPage, {
      global: {
        stubs: { RouterLink: true },
      },
    });

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('Password123');
    await inputs[1].setValue('Password999');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain('no coinciden.');
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('muestra error si no hay token', async () => {
    routeState.query = {};
    const wrapper = mount(ResetPasswordPage, {
      global: {
        stubs: { RouterLink: true },
      },
    });

    expect(wrapper.text()).toContain('ausente.');
  });
});

