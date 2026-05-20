import { endpoints } from '@/shared/api/endpoints';
import { http } from '@/shared/api/http';
import type {
  CreatePaymentMethodPayload,
  PaymentMethod,
  SystemSettings,
  UpdatePaymentMethodPayload,
  UpdateSystemSettingsPayload,
} from '../types/settings.types';

export const settingsService = {
  getSettings() {
    return http.get<SystemSettings>(endpoints.settings.get);
  },
  updateSettings(payload: UpdateSystemSettingsPayload) {
    return http.patch<SystemSettings>(endpoints.settings.update, payload);
  },
  listPaymentMethods() {
    return http.get<PaymentMethod[]>(endpoints.settings.paymentMethods);
  },
  createPaymentMethod(payload: CreatePaymentMethodPayload) {
    return http.post<PaymentMethod>(endpoints.settings.paymentMethods, payload);
  },
  updatePaymentMethod(id: string, payload: UpdatePaymentMethodPayload) {
    return http.patch<PaymentMethod>(endpoints.settings.paymentMethodById(id), payload);
  },
  disablePaymentMethod(id: string, actorUserId?: string) {
    return http.patch<{ success: boolean }>(
      endpoints.settings.disablePaymentMethod(id),
      actorUserId ? { actorUserId } : undefined,
    );
  },
};
