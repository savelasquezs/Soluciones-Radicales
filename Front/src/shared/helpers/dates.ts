export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value));

export const formatDateTime = (value: string | Date) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const formatRelativeDate = (value: string | Date) => {
  const target = new Date(value).getTime();
  const now = Date.now();
  const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays === -1) return 'Ayer';

  return `${Math.abs(diffDays)} días ${diffDays > 0 ? 'después' : 'antes'}`;
};