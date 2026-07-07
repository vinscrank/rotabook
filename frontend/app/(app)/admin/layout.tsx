import AuthGuard from "@/components/AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard roles={["admin"]}>{children}</AuthGuard>;
}
