import { format, isValid, parse } from "date-fns";

export function formatDateValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatTimeValue(date: Date): string {
  return format(date, "HH:mm");
}

export function parseDateValue(value: string): Date | null {
  if (!value) return null;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : null;
}

export function parseTimeValue(value: string): Date | null {
  if (!value) return null;
  const parsed = parse(value, "HH:mm", new Date());
  return isValid(parsed) ? parsed : null;
}
