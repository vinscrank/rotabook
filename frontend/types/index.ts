export type UserRole = "admin" | "staff" | "user";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AvailabilitySlot {
  id: string;
  title: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  status: "available" | "full" | "cancelled";
  createdBy: string;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  slotId: string;
  staffId: string | null;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
}

export interface StaffShift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
}
