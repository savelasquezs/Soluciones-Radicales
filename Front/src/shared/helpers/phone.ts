export const normalizePhoneForWhatsapp = (value: string) =>
  value.replace(/[^\d]/g, '').replace(/^0+/, '');