import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { usersService } from '@/modules/users/services/users.service';
import UsersSettingsPage from '@/modules/settings/pages/UsersSettingsPage.vue';
import { router } from '@/app/router';

const toastPush = vi.fn();

vi.mock('@/shared/composables/useToast', () => ({
  useToast: () => ({ push: toastPush, messages: { value: [] } }),
}));

vi.mock('@/modules/users/services/users.service', () => ({
  usersService: {
    createUser: vi.fn(),
    listTechnicians: vi.fn(),
    getUserById: vi.fn(),
    updateUser: vi.fn(),
  },
}));

describe('Users settings route', () => {
  it('ruta /settings/users existe', () => {
    expect(router.resolve('/settings/users').matched.length).toBeGreaterThan(0);
  });
});

describe('UsersSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    const auth = useAuthStore();
    auth.user = {
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@demo.com',
      role: 'admin',
      isTechnician: false,
    };
  });

  it('carga usuarios al montar y muestra bloque academico', async () => {
    vi.mocked(usersService.listTechnicians).mockResolvedValueOnce([
      {
        id: 'tech-1',
        name: 'Tecnico',
        email: 'tech@demo.com',
        role: 'admin',
        isTechnician: true,
      },
    ]);

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    expect(usersService.listTechnicians).toHaveBeenCalled();
    expect(wrapper.text()).toContain('Demostración académica CRUD');
    expect(wrapper.text()).toContain('Total técnicos');
    expect(wrapper.text()).toContain('Total usuarios visibles');
  });

  it('valida nombre requerido y email requerido/formato', async () => {
    vi.mocked(usersService.listTechnicians).mockResolvedValueOnce([]);

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('El nombre es obligatorio.');
    expect(wrapper.text()).toContain('El email es obligatorio.');

    await wrapper.find('#user-name').setValue('Ana');
    await wrapper.find('#user-email').setValue('correo-invalido');
    await wrapper.find('#user-password').setValue('123456');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('Ingresa un email válido.');
  });

  it('exige password en creacion y no exige password en edicion', async () => {
    vi.mocked(usersService.listTechnicians).mockResolvedValueOnce([
      {
        id: 'tech-1',
        name: 'Tecnico',
        email: 'tech@demo.com',
        role: 'admin',
        isTechnician: true,
      },
    ]);

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    await wrapper.find('#user-name').setValue('Nombre');
    await wrapper.find('#user-email').setValue('nombre@demo.com');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('La contraseña es obligatoria al crear.');

    const editButtons = wrapper
      .findAll('button')
      .filter((button) => button.text() === 'Editar');
    await editButtons[1]?.trigger('click');

    expect((wrapper.find('#user-password').element as HTMLInputElement).disabled).toBe(true);
  });

  it('crea usuario sin recargar pagina', async () => {
    vi.mocked(usersService.listTechnicians)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'tech-2',
          name: 'Nuevo',
          email: 'nuevo@demo.com',
          role: 'admin',
          isTechnician: true,
        },
      ]);
    vi.mocked(usersService.createUser).mockResolvedValueOnce({
      id: 'tech-2',
      name: 'Nuevo',
      email: 'nuevo@demo.com',
      role: 'admin',
      isTechnician: true,
    });

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    await wrapper.find('#user-name').setValue('Nuevo');
    await wrapper.find('#user-email').setValue('nuevo@demo.com');
    await wrapper.find('#user-password').setValue('123456');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(usersService.createUser).toHaveBeenCalledWith({
      name: 'Nuevo',
      email: 'nuevo@demo.com',
      password: '123456',
      role: 'admin',
      isTechnician: false,
    });
    expect(wrapper.text()).toContain('Usuario creado correctamente.');
  });

  it('carga usuario en formulario al editar, actualiza y cancela edicion', async () => {
    vi.mocked(usersService.listTechnicians)
      .mockResolvedValueOnce([
        {
          id: 'tech-1',
          name: 'Tecnico',
          email: 'tech@demo.com',
          role: 'admin',
          isTechnician: true,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'tech-1',
          name: 'Tecnico Editado',
          email: 'tech@demo.com',
          role: 'admin',
          isTechnician: true,
        },
      ]);
    vi.mocked(usersService.updateUser).mockResolvedValueOnce({
      id: 'tech-1',
      name: 'Tecnico Editado',
      email: 'tech@demo.com',
      role: 'admin',
      isTechnician: true,
    });

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    const editButtons = wrapper
      .findAll('button')
      .filter((button) => button.text() === 'Editar');
    await editButtons[1]?.trigger('click');

    expect((wrapper.find('#user-name').element as HTMLInputElement).value).toBe('Tecnico');
    expect(wrapper.text()).toContain('Editar usuario');

    await wrapper.find('#user-name').setValue('Tecnico Editado');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(usersService.updateUser).toHaveBeenCalledWith('tech-1', {
      name: 'Tecnico Editado',
      email: 'tech@demo.com',
      isTechnician: true,
    });

    const cancelButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Cancelar edición');
    await cancelButton?.trigger('click');
    expect(wrapper.text()).toContain('Crear usuario');
  });

  it('muestra estado vacio cuando no hay usuario autenticado ni tecnicos', async () => {
    const auth = useAuthStore();
    auth.user = null;
    vi.mocked(usersService.listTechnicians).mockResolvedValueOnce([]);

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    expect(wrapper.text()).toContain(
      'No hay usuarios visibles con el contrato actual.',
    );
  });
});
