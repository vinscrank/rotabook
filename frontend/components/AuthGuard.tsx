"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { homeForRole } from "@/lib/roles";
import { UserRole } from "@/types";
import LoadingState from "./LoadingState";

export default function AuthGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!profile) return;
    if (roles && !roles.includes(profile.role)) {
      router.replace(homeForRole(profile.role));
    }
  }, [loading, user, profile, roles, router]);

  if (loading || !user || !profile) return <LoadingState />;
  if (roles && !roles.includes(profile.role)) return <LoadingState />;
  return <>{children}</>;
}
