export const toDatetimeLocalValue = (value?: string | null) => {
  if (!value) return '';

  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

export const toIsoFromDatetimeLocal = (value: string) => {
  if (!value.trim()) return undefined;
  return new Date(value).toISOString();
};

export const addDaysToIsoDate = (isoDate: string, days: number) => {
  const base = new Date(isoDate);
  if (Number.isNaN(base.getTime())) return undefined;
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString();
};
