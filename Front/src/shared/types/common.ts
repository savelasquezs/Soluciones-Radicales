export type ID = string;

export type UserRole = 'admin' | 'technician';

export type ServiceStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'rescheduled';

export type ServiceType = 'main' | 'reinforcement';

export type PaymentMethodType = 'cash' | 'bank' | 'transfer' | 'card' | 'other';

export type TechnicianRevenueMode = 'split' | 'full';

export type ISODateString = string;

export type DateRangeQuery = {
  from?: ISODateString;
  to?: ISODateString;
};

export type AppUser = {
  id: ID;
  name: string;
  email: string;
  role: UserRole;
  isTechnician: boolean;
};
