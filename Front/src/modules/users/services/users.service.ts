import { endpoints } from '@/shared/api/endpoints';
import { http } from '@/shared/api/http';
import type { CreateUserPayload, UpdateUserPayload, User } from '../types/users.types';

export const usersService = {
  createUser(payload: CreateUserPayload) {
    return http.post<User>(endpoints.users.create, payload);
  },
  listTechnicians() {
    return http.get<User[]>(endpoints.users.technicians);
  },
  getUserById(id: string) {
    return http.get<User>(endpoints.users.byId(id));
  },
  updateUser(id: string, payload: UpdateUserPayload) {
    return http.patch<User>(endpoints.users.update(id), payload);
  },
};
