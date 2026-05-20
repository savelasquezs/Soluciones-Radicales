export type UserRole = 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isTechnician: boolean;
  active: boolean;
  disabledAt: Date | null;
  createdAt: Date;
}
