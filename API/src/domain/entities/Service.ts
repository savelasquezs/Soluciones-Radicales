export type ServiceType = 'main' | 'reinforcement';

export type ServiceStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'rescheduled';

export interface Service {
  id: string;
  branchId: string;
  scheduledAt: Date;
  type: ServiceType;
  status: ServiceStatus;
  createdBy: string | null;
  notes: string | null;
  paymentMethodId: string | null;
  paymentProofUrl: string | null;
  price: number | null;
  createdAt: Date;
  businessName?: string | null;
  branchName?: string | null;
  branchAddress?: string | null;
  branchPhone?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  paymentMethodName?: string | null;
  technicians?: Array<{ id: string; name: string }>;
}
