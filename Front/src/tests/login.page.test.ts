import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginPage from '@/modules/auth/pages/LoginPage.vue';

const pushMock = vi.fn();
const useRouteMock = vi.fn(() => ({ query: {} }));
const loginMock = vi.fn();

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
  useRouter: () => ({ push: pushMock }),
  useRoute: () => useRouteMock(),
}));

vi.mock('@/modules/auth/stores/auth.store', () => ({
  useAuthStore: () => ({
    isLoading: false,
    login: loginMock,
    resolveHomePath: () => '/dashboard',
  }),
}));

vi.mock('@/shared/composables/useToast', () => ({
  useToast: () => ({ push: vi.fn(), messages: [] }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza campos', () => {
    const wrapper = mount(LoginPage);
    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(2);
  });

  it('llama store login al enviar', async () => {
    loginMock.mockResolvedValue(undefined);
    const wrapper = mount(LoginPage);

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('admin@demo.com');
    await inputs[1].setValue('Secret123');
    await wrapper.find('form').trigger('submit.prevent');

    expect(loginMock).toHaveBeenCalledWith('admin@demo.com', 'Secret123');
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});
