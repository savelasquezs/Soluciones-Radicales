import { normalizePhoneForWhatsapp } from './phone';

export const buildWhatsappLink = (message: string, phone: string) => {
  const normalizedPhone = normalizePhoneForWhatsapp(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
};