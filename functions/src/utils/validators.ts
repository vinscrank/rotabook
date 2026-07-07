import { HttpsError } from "firebase-functions/v2/https";

export function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", `${field} is required`);
  }

  return value.trim();
}

export function assertPositiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new HttpsError("invalid-argument", `${field} must be a positive integer`);
  }

  return Number(value);
}

export function assertDateString(value: unknown, field: string): string {
  const date = assertString(value, field);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpsError("invalid-argument", `${field} must use YYYY-MM-DD`);
  }

  return date;
}

export function assertTimeString(value: unknown, field: string): string {
  const time = assertString(value, field);

  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new HttpsError("invalid-argument", `${field} must use HH:mm`);
  }

  return time;
}

export function assertTimeRange(startTime: string, endTime: string): void {
  if (startTime >= endTime) {
    throw new HttpsError("invalid-argument", "endTime must be after startTime");
  }
}

const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
const ADMIN_BOOKING_STATUSES = ["confirmed", "cancelled", "completed"] as const;

export function assertBookingStatus(value: unknown): (typeof BOOKING_STATUSES)[number] {
  const status = assertString(value, "status");

  if (!BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
    throw new HttpsError("invalid-argument", "Invalid booking status");
  }

  return status as (typeof BOOKING_STATUSES)[number];
}

export function assertAdminBookingStatus(
  value: unknown
): (typeof ADMIN_BOOKING_STATUSES)[number] {
  const status = assertString(value, "status");

  if (!ADMIN_BOOKING_STATUSES.includes(status as (typeof ADMIN_BOOKING_STATUSES)[number])) {
    throw new HttpsError("invalid-argument", "Invalid admin booking status");
  }

  return status as (typeof ADMIN_BOOKING_STATUSES)[number];
}