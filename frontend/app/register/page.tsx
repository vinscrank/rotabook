"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { homeForRole } from "@/lib/roles";
import { PrimaryButton } from "@/components/Buttons";
import SoftBackdrop from "@/components/SoftBackdrop";

export default function RegisterPage() {
  const { signUp, user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
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
      await signUp(name, email, password);
    } catch {
      setError("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <SoftBackdrop />
      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md rounded-2xl p-8 space-y-4 relative z-10">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
          required
        />
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
          {loading ? "Creating..." : "Register"}
        </PrimaryButton>
        <p className="text-sm text-gray-400 text-center">
          Already have an account? <Link href="/login" className="text-violet-400">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
