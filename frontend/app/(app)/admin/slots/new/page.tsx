"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { PrimaryButton } from "@/components/Buttons";
import { getCallableErrorMessage } from "@/lib/callableError";
import DatePickerField from "@/components/DatePickerField";
import FormField from "@/components/FormField";
import TimePickerField from "@/components/TimePickerField";
import FeedbackMessage from "@/components/FeedbackMessage";
import { OverlayLoading } from "@/components/LoadingState";
import Title from "@/components/Title";
import { formInputClassName } from "@/lib/formStyles";

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
      setError(getCallableErrorMessage(err, "Failed to create slot"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {loading && <OverlayLoading label="Creating slot..." />}
      <Title heading="Create slot" />
      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
        <FormField label="Title">
          <input
            placeholder="Morning session"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={formInputClassName}
            required
            disabled={loading}
          />
        </FormField>
        <FormField label="Service name">
          <input
            placeholder="Personal training"
            value={form.serviceName}
            onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
            className={formInputClassName}
            required
            disabled={loading}
          />
        </FormField>
        <FormField label="Date">
          <DatePickerField
            value={form.date}
            onChange={(date) => setForm({ ...form, date })}
            placeholder="Select date"
            required
            minDate={new Date()}
            disabled={loading}
          />
        </FormField>
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField label="Start time">
            <TimePickerField
              value={form.startTime}
              onChange={(startTime) => setForm({ ...form, startTime })}
              placeholder="Select start time"
              required
              disabled={loading}
            />
          </FormField>
          <FormField label="End time">
            <TimePickerField
              value={form.endTime}
              onChange={(endTime) => setForm({ ...form, endTime })}
              placeholder="Select end time"
              required
              disabled={loading}
            />
          </FormField>
        </div>
        <FormField label="Capacity">
          <input
            type="number"
            placeholder="10"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            className={formInputClassName}
            required
            disabled={loading}
          />
        </FormField>
        {error && <FeedbackMessage message={error} variant="error" />}
        <PrimaryButton type="submit" className="w-full justify-center py-3" disabled={loading}>
          {loading ? "Creating..." : "Create slot"}
        </PrimaryButton>
      </form>
    </div>
  );
}
