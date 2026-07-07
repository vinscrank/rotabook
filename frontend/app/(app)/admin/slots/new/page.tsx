"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { PrimaryButton } from "@/components/Buttons";
import Title from "@/components/Title";

export default function NewSlotPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    serviceName: "",
    date: "",
    startTime: "",
    endTime: "",
    capacity: "10",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const createSlot = httpsCallable(functions, "createSlot");
      await createSlot({
        ...form,
        capacity: Number(form.capacity),
      });
      router.push("/admin/slots");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to create slot");
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <input
      type={type}
      placeholder={label}
      value={form[key]}
      onChange={(ev) => setForm({ ...form, [key]: ev.target.value })}
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
      required
    />
  );

  return (
    <div className="max-w-lg">
      <Title heading="Create slot" />
      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-4">
        {field("title", "Title")}
        {field("serviceName", "Service name")}
        {field("date", "Date (YYYY-MM-DD")}
        {field("startTime", "Start (HH:mm)")}
        {field("endTime", "End (HH:mm)")}
        {field("capacity", "Capacity", "number")}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <PrimaryButton type="submit" className="w-full justify-center py-3" disabled={loading}>
          {loading ? "Creating..." : "Create slot"}
        </PrimaryButton>
      </form>
    </div>
  );
}
