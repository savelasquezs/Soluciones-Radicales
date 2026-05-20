import { endpoints } from '@/shared/api/endpoints';
import { http } from '@/shared/api/http';
import type { CreateUserPayload, UpdateUserPayload, User } from '../types/users.types';

export const usersService = {
  createUser(payload: CreateUserPayload) {
    return http.post<User>(endpoints.users.create, payload);
  },
  listUsers() {
    return http.get<User[]>(endpoints.users.list);
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
  disableUser(id: string, actorUserId?: string) {
    return http.patch<{ success: true }>(
      endpoints.users.disable(id),
      actorUserId ? { actorUserId } : undefined,
    );
  },
};
