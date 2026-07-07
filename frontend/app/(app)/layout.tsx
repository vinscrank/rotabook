import AppNavbar from "@/components/AppNavbar";
import AuthGuard from "@/components/AuthGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppNavbar />
      <main className="pt-28 px-4 pb-16 max-w-6xl mx-auto">{children}</main>
    </AuthGuard>
  );
}
