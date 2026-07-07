"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { homeForRole } from "@/lib/roles";
import { PrimaryButton } from "@/components/Buttons";
import FeedbackMessage from "@/components/FeedbackMessage";
import LoadingState, { OverlayLoading } from "@/components/LoadingState";
import SoftBackdrop from "@/components/SoftBackdrop";

export default function RegisterPage() {
  const { signUp, user, profile, loading: authLoading, profileLoading, profileError } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !profileLoading && user && profile) {
      router.replace(homeForRole(profile.role));
    }
  }, [authLoading, profileLoading, user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signUp(name, email, password);
    } catch {
      setError("Registration failed");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (submitting && user && !profileLoading && !profile && profileError) {
      setSubmitting(false);
    }
  }, [submitting, user, profileLoading, profile, profileError]);

  const isBusy = submitting || profileLoading || (Boolean(user) && !profile && !profileError);
  const displayError = error || profileError;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState label="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {isBusy && (
        <OverlayLoading
          label={profileLoading ? "Setting up profile..." : "Creating account..."}
        />
      )}
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
          disabled={isBusy}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
          required
          disabled={isBusy}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
          required
          disabled={isBusy}
        />
        {displayError && <FeedbackMessage message={displayError} variant="error" />}
        <PrimaryButton type="submit" className="w-full justify-center py-3" disabled={isBusy}>
          {isBusy ? "Creating account..." : "Register"}
        </PrimaryButton>
        <p className="text-sm text-gray-400 text-center">
          Already have an account? <Link href="/login" className="text-violet-400">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
