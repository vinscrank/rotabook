import { UserRole } from "@/types";

export function homeForRole(role: UserRole): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "staff") return "/staff/schedule";
  return "/book";
}
