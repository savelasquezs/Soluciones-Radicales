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
    listUsers: vi.fn(),
    listTechnicians: vi.fn(),
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    disableUser: vi.fn(),
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
    vi.mocked(usersService.listUsers).mockResolvedValueOnce([
      {
        id: 'user-1',
        name: 'Usuario',
        email: 'user@demo.com',
        role: 'admin',
        isTechnician: true,
      },
    ]);

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    expect(usersService.listUsers).toHaveBeenCalled();
    expect(wrapper.text()).toContain('Total técnicos');
  });

  it('valida nombre requerido y email requerido/formato', async () => {
    vi.mocked(usersService.listUsers).mockResolvedValueOnce([]);

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    await wrapper.find('button.button-primary').trigger('click');
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
    vi.mocked(usersService.listUsers).mockResolvedValueOnce([
      {
        id: 'user-1',
        name: 'Usuario',
        email: 'user@demo.com',
        role: 'admin',
        isTechnician: true,
      },
    ]);

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    await wrapper.find('button.button-primary').trigger('click');
    await wrapper.find('#user-name').setValue('Nombre');
    await wrapper.find('#user-email').setValue('nombre@demo.com');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('La contraseña es obligatoria al crear.');

    const editButtons = wrapper
      .findAll('button')
      .filter((button) => button.text() === 'Editar');
    await editButtons[0]?.trigger('click');

    expect((wrapper.find('#user-password').element as HTMLInputElement).disabled).toBe(true);
  });

  it('crea usuario sin recargar pagina', async () => {
    vi.mocked(usersService.listUsers)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'user-2',
          name: 'Nuevo',
          email: 'nuevo@demo.com',
          role: 'admin',
          isTechnician: true,
        },
      ]);
    vi.mocked(usersService.createUser).mockResolvedValueOnce({
      id: 'user-2',
      name: 'Nuevo',
      email: 'nuevo@demo.com',
      role: 'admin',
      isTechnician: true,
    });

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    await wrapper.find('button.button-primary').trigger('click');
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
      isTechnician: true,
    });
    expect(wrapper.text()).toContain('Usuario creado correctamente.');
  });

  it('carga usuario en formulario al editar, actualiza y cancela edicion', async () => {
    vi.mocked(usersService.listUsers)
      .mockResolvedValueOnce([
        {
          id: 'user-1',
          name: 'Usuario',
          email: 'user@demo.com',
          role: 'admin',
          isTechnician: true,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'user-1',
          name: 'Usuario Editado',
          email: 'user@demo.com',
          role: 'admin',
          isTechnician: true,
        },
      ]);
    vi.mocked(usersService.updateUser).mockResolvedValueOnce({
      id: 'user-1',
      name: 'Usuario Editado',
      email: 'user@demo.com',
      role: 'admin',
      isTechnician: true,
    });

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    const editButtons = wrapper
      .findAll('button')
      .filter((button) => button.text() === 'Editar');
    await editButtons[0]?.trigger('click');

    expect((wrapper.find('#user-name').element as HTMLInputElement).value).toBe('Usuario');
    expect(wrapper.text()).toContain('Editar usuario');

    await wrapper.find('#user-name').setValue('Usuario Editado');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(usersService.updateUser).toHaveBeenCalledWith('user-1', {
      name: 'Usuario Editado',
      email: 'user@demo.com',
      isTechnician: true,
    });

    const cancelButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Cancelar edición');
    await cancelButton?.trigger('click');
    expect(wrapper.text()).toContain('Crear usuario');
  });

  it('desactiva usuario con confirmacion', async () => {
    vi.mocked(usersService.listUsers)
      .mockResolvedValueOnce([
        {
          id: 'user-2',
          name: 'Usuario',
          email: 'usuario@demo.com',
          role: 'admin',
          isTechnician: false,
        },
      ])
      .mockResolvedValueOnce([]);
    vi.mocked(usersService.disableUser).mockResolvedValueOnce({ success: true });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const wrapper = mount(UsersSettingsPage);
    await flushPromises();

    const disableButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Desactivar');
    await disableButton?.trigger('click');
    await flushPromises();

    expect(usersService.disableUser).toHaveBeenCalledWith('user-2', 'admin-1');
    expect(wrapper.text()).toContain('Usuario desactivado correctamente.');
  });
});
