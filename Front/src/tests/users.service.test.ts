import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usersService } from '@/modules/users/services/users.service';
import { endpoints } from '@/shared/api/endpoints';
import { http } from '@/shared/api/http';

vi.mock('@/shared/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listTechnicians llama endpoint correcto', async () => {
    vi.mocked(http.get).mockResolvedValueOnce([] as any);

    await usersService.listTechnicians();

    expect(http.get).toHaveBeenCalledWith(endpoints.users.technicians);
  });

  it('createUser envia payload correcto', async () => {
    const payload = {
      name: 'Nuevo',
      email: 'nuevo@demo.com',
      password: '123456',
      role: 'admin' as const,
      isTechnician: true,
    };
    vi.mocked(http.post).mockResolvedValueOnce({ id: 'u-1', ...payload } as any);

    await usersService.createUser(payload);

    expect(http.post).toHaveBeenCalledWith(endpoints.users.create, payload);
  });

  it('updateUser llama endpoint correcto', async () => {
    const payload = {
      name: 'Editado',
      email: 'editado@demo.com',
      isTechnician: false,
    };
    vi.mocked(http.patch).mockResolvedValueOnce({ id: 'u-1', ...payload } as any);

    await usersService.updateUser('u-1', payload);

    expect(http.patch).toHaveBeenCalledWith(endpoints.users.update('u-1'), payload);
  });
});
