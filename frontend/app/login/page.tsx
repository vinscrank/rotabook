"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { homeForRole } from "@/lib/roles";
import { PrimaryButton } from "@/components/Buttons";
import SoftBackdrop from "@/components/SoftBackdrop";

export default function LoginPage() {
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && profile) {
      router.replace(homeForRole(profile.role));
    }
  }, [authLoading, user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <SoftBackdrop />
      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md rounded-2xl p-8 space-y-4 relative z-10">
        <h1 className="text-2xl font-semibold">Sign in to RotaBook</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <PrimaryButton type="submit" className="w-full justify-center py-3" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </PrimaryButton>
        <p className="text-sm text-gray-400 text-center">
          No account? <Link href="/register" className="text-violet-400">Register</Link>
        </p>
      </form>
    </div>
  );
}
