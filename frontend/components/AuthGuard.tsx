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
  const { user, profile, loading, profileLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (!profile) return;
    if (roles && !roles.includes(profile.role)) {
      router.replace(homeForRole(profile.role));
    }
  }, [loading, profileLoading, user, profile, roles, router]);

  if (loading || profileLoading || !user || !profile) return <LoadingState label="Loading..." />;
  if (roles && !roles.includes(profile.role)) return <LoadingState label="Loading..." />;
  return <>{children}</>;
}
