import type {
  DateRangeQuery,
  ID,
  ISODateString,
  ServiceStatus,
  ServiceType,
} from '@/shared/types/common';

export type Service = {
  id: ID;
  branchId: ID;
  scheduledAt: ISODateString;
  status: ServiceStatus;
  type: ServiceType;
  price?: number;
  notes?: string | null;
  paymentMethodId?: ID | null;
  paymentProofUrl?: string | null;
  technicians?: Array<{ id: ID; name?: string }>;
  businessName?: string | null;
  branchName?: string | null;
  branchAddress?: string | null;
  branchPhone?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  paymentMethodName?: string | null;
};

export type ServiceEvidence = {
  id: ID;
  serviceId: ID;
  fileUrl: string;
};

export type CreateServicePayload = {
  branchId: ID;
  scheduledAt: ISODateString;
  type: ServiceType;
  status?: ServiceStatus;
  price?: number;
};

export type ServicesByDayQuery = {
  date: ISODateString;
};

export type ServicesByMonthQuery = {
  year: number;
  month: number;
};

export type UpcomingServicesQuery = {
  days?: number;
};

export type TechnicianScheduleQuery = DateRangeQuery;

export type TechnicianScheduleResponse = {
  technician: {
    id: ID;
    name: string;
    email?: string;
    isTechnician: boolean;
  };
  services: Service[];
};

export type UpdateServiceStatusPayload = {
  status: ServiceStatus;
};

export type RescheduleServicePayload = {
  scheduledAt: ISODateString;
};

export type CancelServicePayload = {
  actorUserId?: ID;
};

export type AssignTechniciansPayload = {
  technicianIds: ID[];
};

export type AddServiceNotesPayload = {
  notes: string;
};

export type UpdateServicePaymentPayload = {
  paymentMethodId: ID;
};

export type UploadFilePayload = {
  fileName: string;
  contentType: string;
  contentBase64: string;
};

export type GenerateReinforcementPayload = {
  price?: number;
};
