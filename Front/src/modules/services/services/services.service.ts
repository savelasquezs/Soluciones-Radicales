import { endpoints } from '@/shared/api/endpoints';
import { http } from '@/shared/api/http';
import type {
  AddServiceNotesPayload,
  AssignTechniciansPayload,
  CancelServicePayload,
  CreateServicePayload,
  GenerateReinforcementPayload,
  RescheduleServicePayload,
  Service,
  ServiceEvidence,
  ServicesByDayQuery,
  ServicesByMonthQuery,
  TechnicianScheduleQuery,
  UpcomingServicesQuery,
  UpdateServicePaymentPayload,
  UpdateServiceStatusPayload,
  UploadFilePayload,
} from '../types/services.types';

export const servicesService = {
  createService(payload: CreateServicePayload) {
    return http.post<Service>(endpoints.services.create, payload);
  },
  getServiceById(id: string) {
    return http.get<Service>(endpoints.services.byId(id));
  },
  getServicesByDay(query: ServicesByDayQuery) {
    return http.get<Service[]>(endpoints.services.day, { params: query });
  },
  getServicesByMonth(query: ServicesByMonthQuery) {
    return http.get<Service[]>(endpoints.services.month, { params: query });
  },
  getUpcomingServices(query?: UpcomingServicesQuery) {
    return http.get<Service[]>(endpoints.services.upcoming, { params: query });
  },
  getTechnicianSchedule(technicianId: string, query?: TechnicianScheduleQuery) {
    return http.get<Service[]>(endpoints.services.technicianSchedule(technicianId), { params: query });
  },
  updateServiceStatus(id: string, payload: UpdateServiceStatusPayload) {
    return http.patch<Service>(endpoints.services.updateStatus(id), payload);
  },
  rescheduleService(id: string, payload: RescheduleServicePayload) {
    return http.patch<Service>(endpoints.services.reschedule(id), payload);
  },
  cancelService(id: string, payload?: CancelServicePayload) {
    return http.patch<Service>(endpoints.services.cancel(id), payload);
  },
  assignTechniciansToService(id: string, payload: AssignTechniciansPayload) {
    return http.post<{ success: boolean }>(endpoints.services.assignTechnicians(id), payload);
  },
  startService(id: string) {
    return http.patch<Service>(endpoints.services.start(id));
  },
  completeService(id: string) {
    return http.patch<Service>(endpoints.services.complete(id));
  },
  addServiceNotes(id: string, payload: AddServiceNotesPayload) {
    return http.patch<Service>(endpoints.services.notes(id), payload);
  },
  updateServicePayment(id: string, payload: UpdateServicePaymentPayload) {
    return http.patch<Service>(endpoints.services.payment(id), payload);
  },
  addPaymentProof(id: string, payload: UploadFilePayload) {
    return http.post<Service>(endpoints.services.paymentProof(id), payload);
  },
  addServiceEvidence(id: string, payload: UploadFilePayload) {
    return http.post<ServiceEvidence>(endpoints.services.evidences(id), payload);
  },
  listServiceEvidences(id: string) {
    return http.get<ServiceEvidence[]>(endpoints.services.evidences(id));
  },
  generateReinforcementService(id: string, payload?: GenerateReinforcementPayload) {
    return http.post<Service>(endpoints.services.generateReinforcement(id), payload);
  },
};
