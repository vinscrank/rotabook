"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOutIcon, MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { homeForRole } from "@/lib/roles";
import { PrimaryButton, GhostButton } from "./Buttons";
import { OverlayLoading } from "@/components/LoadingState";
import Logo from "./Logo";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/slots", label: "Slots" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/shifts", label: "Shifts" },
];

const staffLinks = [
  { href: "/staff/schedule", label: "Schedule" },
  { href: "/staff/bookings", label: "Bookings" },
];

const userLinks = [
  { href: "/book", label: "Book" },
  { href: "/my-bookings", label: "My bookings" },
];

export default function AppNavbar() {
  const { profile, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!profile) return null;

  const displayName =
    profile.name?.trim() ||
    user?.displayName?.trim() ||
    profile.email?.split("@")[0] ||
    "User";

  const links =
    profile.role === "admin"
      ? [...adminLinks, ...userLinks]
      : profile.role === "staff"
        ? [...staffLinks, ...userLinks]
        : userLinks;

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  };

  return (
    <nav className="fixed top-5 left-0 right-0 z-50 px-4">
      {loggingOut && <OverlayLoading label="Signing out..." />}
      <div className="max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-3">
        <Link href={homeForRole(profile.role)}>
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname.startsWith(link.href) ? "text-white" : "hover:text-white"}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
          </div>
          <GhostButton onClick={handleLogout}>
            <LogOutIcon className="size-4" />
            Logout
          </GhostButton>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden">
          <MenuIcon className="size-6" />
        </button>
      </div>

      {open && (
        <div className="md:hidden mt-2 glass-panel rounded-2xl p-4 flex flex-col gap-3">
          <div className="pb-2 border-b border-white/10">
            <p className="font-medium text-white">{displayName}</p>
            <p className="text-xs text-gray-400 capitalize mt-1">{profile.role}</p>
          </div>
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <PrimaryButton onClick={handleLogout} className="w-full justify-center">
            Logout
          </PrimaryButton>
          <button onClick={() => setOpen(false)}>
            <XIcon className="size-5" />
          </button>
        </div>
      )}
    </nav>
  );
}
