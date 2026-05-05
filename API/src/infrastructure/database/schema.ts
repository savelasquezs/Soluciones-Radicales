import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(),
  isTechnician: boolean('is_technician').default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const systemSettingsTable = pgTable('system_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessName: text('business_name').notNull(),
  logoUrl: text('logo_url'),
  defaultFrequencyDays: numeric('default_frequency_days', { mode: 'number' }).notNull(),
  defaultReinforcementDays: numeric('default_reinforcement_days', { mode: 'number' }).notNull(),
  reinforcementEnabledDefault: boolean('reinforcement_enabled_default').default(true),
  reinforcementIsPaidDefault: boolean('reinforcement_is_paid_default').default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const paymentMethodsTable = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  active: boolean('active').default(true),
});

export const clientsTable = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  contactName: text('contact_name'),
  phone: text('phone'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const businessesTable = pgTable('businesses', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull(),
  name: text('name').notNull(),
});

export const branchesTable = pgTable('branches', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull(),
  address: text('address').notNull(),
  phone: text('phone'),
  city: text('city'),
  pricePerM2: numeric('price_per_m2', { mode: 'number' }),
  fixedPrice: numeric('fixed_price', { mode: 'number' }),
  frequencyDays: numeric('frequency_days', { mode: 'number' }),
  reinforcementDays: numeric('reinforcement_days', { mode: 'number' }),
  reinforcementEnabled: boolean('reinforcement_enabled'),
  reinforcementIsPaid: boolean('reinforcement_is_paid'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const serviceCyclesTable = pgTable('service_cycles', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').notNull().unique(),
  lastServiceDate: timestamp('last_service_date', { mode: 'date' }),
  nextMainServiceDate: timestamp('next_main_service_date', { mode: 'date' }),
  nextReinforcementDate: timestamp('next_reinforcement_date', { mode: 'date' }),
  active: boolean('active').default(true),
});

export const servicesTable = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchId: uuid('branch_id').notNull(),
  scheduledAt: timestamp('scheduled_at', { mode: 'date' }).notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  createdBy: uuid('created_by'),
  notes: text('notes'),
  paymentMethodId: uuid('payment_method_id'),
  paymentProofUrl: text('payment_proof_url'),
  price: numeric('price', { mode: 'number' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const serviceTechniciansTable = pgTable('service_technicians', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id').notNull(),
  technicianId: uuid('technician_id').notNull(),
});

export const serviceEvidencesTable = pgTable('service_evidences', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id').notNull(),
  imageUrl: text('image_url').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const activityLogsTable = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  action: text('action').notNull(),
  entity: text('entity'),
  entityId: uuid('entity_id'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

