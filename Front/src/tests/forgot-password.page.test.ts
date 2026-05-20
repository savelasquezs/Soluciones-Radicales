import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ForgotPasswordPage from '@/modules/auth/pages/ForgotPasswordPage.vue';

const forgotPasswordMock = vi.fn();

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
}));

vi.mock('@/modules/auth/stores/auth.store', () => ({
  useAuthStore: () => ({
    isLoading: false,
    forgotPassword: forgotPasswordMock,
  }),
}));

vi.mock('@/shared/composables/useToast', () => ({
  useToast: () => ({ push: vi.fn(), messages: [] }),
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra mensaje generico de exito', async () => {
    forgotPasswordMock.mockResolvedValue({ success: true });
    const wrapper = mount(ForgotPasswordPage);

    await wrapper.find('input').setValue('admin@demo.com');
    await wrapper.find('form').trigger('submit.prevent');

    expect(forgotPasswordMock).toHaveBeenCalledWith('admin@demo.com');
    expect(wrapper.text()).toContain('Si el correo existe, recibirás instrucciones para restablecer tu contraseña.');
  });
});
