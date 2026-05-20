import {
  ActivityLog,
  Branch,
  Business,
  Client,
  PasswordResetToken,
  PaymentMethod,
  RefreshToken,
  Service,
  ServiceCycle,
  ServiceEvidence,
  SystemSettings,
  User,
} from '../../domain/entities';
import {
  activityLogsTable,
  branchesTable,
  businessesTable,
  clientsTable,
  passwordResetTokensTable,
  paymentMethodsTable,
  refreshTokensTable,
  serviceCyclesTable,
  serviceEvidencesTable,
  servicesTable,
  systemSettingsTable,
  usersTable,
} from './schema';

type UserRow = typeof usersTable.$inferSelect;
type RefreshTokenRow = typeof refreshTokensTable.$inferSelect;
type PasswordResetTokenRow = typeof passwordResetTokensTable.$inferSelect;
type ClientRow = typeof clientsTable.$inferSelect;
type BusinessRow = typeof businessesTable.$inferSelect;
type BranchRow = typeof branchesTable.$inferSelect;
type ServiceRow = typeof servicesTable.$inferSelect;
type ServiceCycleRow = typeof serviceCyclesTable.$inferSelect;
type ServiceEvidenceRow = typeof serviceEvidencesTable.$inferSelect;
type PaymentMethodRow = typeof paymentMethodsTable.$inferSelect;
type SystemSettingsRow = typeof systemSettingsTable.$inferSelect;
type ActivityLogRow = typeof activityLogsTable.$inferSelect;

export const toUserEntity = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  password: row.password,
  role: row.role as User['role'],
  isTechnician: row.isTechnician ?? false,
  createdAt: row.createdAt ?? new Date(),
});

export const toRefreshTokenEntity = (row: RefreshTokenRow): RefreshToken => ({
  id: row.id,
  userId: row.userId,
  tokenHash: row.tokenHash,
  expiresAt: row.expiresAt,
  revokedAt: row.revokedAt,
  createdAt: row.createdAt ?? new Date(),
});

export const toPasswordResetTokenEntity = (
  row: PasswordResetTokenRow,
): PasswordResetToken => ({
  id: row.id,
  userId: row.userId,
  tokenHash: row.tokenHash,
  expiresAt: row.expiresAt,
  usedAt: row.usedAt,
  createdAt: row.createdAt ?? new Date(),
});

export const toClientEntity = (row: ClientRow): Client => ({
  id: row.id,
  name: row.name,
  contactName: row.contactName,
  phone: row.phone,
  createdAt: row.createdAt ?? new Date(),
});

export const toBusinessEntity = (row: BusinessRow): Business => ({
  id: row.id,
  clientId: row.clientId,
  name: row.name,
});

export const toBranchEntity = (row: BranchRow): Branch => ({
  id: row.id,
  businessId: row.businessId,
  address: row.address,
  phone: row.phone,
  city: row.city,
  pricePerM2: row.pricePerM2,
  fixedPrice: row.fixedPrice,
  frequencyDays: row.frequencyDays,
  reinforcementDays: row.reinforcementDays,
  reinforcementEnabled: row.reinforcementEnabled,
  reinforcementIsPaid: row.reinforcementIsPaid,
  technicianRevenueMode: row.technicianRevenueMode as Branch['technicianRevenueMode'],
  createdAt: row.createdAt ?? new Date(),
});

export const toServiceEntity = (row: ServiceRow): Service => ({
  id: row.id,
  branchId: row.branchId,
  scheduledAt: row.scheduledAt,
  type: row.type as Service['type'],
  status: row.status as Service['status'],
  createdBy: row.createdBy,
  notes: row.notes,
  paymentMethodId: row.paymentMethodId,
  paymentProofUrl: row.paymentProofUrl,
  price: row.price,
  createdAt: row.createdAt ?? new Date(),
});

export const toServiceCycleEntity = (row: ServiceCycleRow): ServiceCycle => ({
  id: row.id,
  branchId: row.branchId,
  lastServiceDate: row.lastServiceDate,
  nextMainServiceDate: row.nextMainServiceDate,
  nextReinforcementDate: row.nextReinforcementDate,
  active: row.active ?? true,
});

export const toServiceEvidenceEntity = (row: ServiceEvidenceRow): ServiceEvidence => ({
  id: row.id,
  serviceId: row.serviceId,
  imageUrl: row.imageUrl,
  createdAt: row.createdAt ?? new Date(),
});

export const toPaymentMethodEntity = (row: PaymentMethodRow): PaymentMethod => ({
  id: row.id,
  name: row.name,
  type: row.type as PaymentMethod['type'],
  active: row.active ?? true,
});

export const toSystemSettingsEntity = (
  row: SystemSettingsRow,
): SystemSettings => ({
  id: row.id,
  businessName: row.businessName,
  logoUrl: row.logoUrl,
  defaultFrequencyDays: row.defaultFrequencyDays,
  defaultReinforcementDays: row.defaultReinforcementDays,
  reinforcementEnabledDefault: row.reinforcementEnabledDefault ?? true,
  reinforcementIsPaidDefault: row.reinforcementIsPaidDefault ?? false,
  createdAt: row.createdAt ?? new Date(),
  updatedAt: row.updatedAt ?? new Date(),
});

export const toActivityLogEntity = (row: ActivityLogRow): ActivityLog => ({
  id: row.id,
  userId: row.userId,
  action: row.action,
  entity: row.entity,
  entityId: row.entityId,
  createdAt: row.createdAt ?? new Date(),
});
