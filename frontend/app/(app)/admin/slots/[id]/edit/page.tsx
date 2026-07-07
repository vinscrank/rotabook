"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { getCallableErrorMessage } from "@/lib/callableError";
import { AvailabilitySlot } from "@/types";
import { GhostButton, PrimaryButton } from "@/components/Buttons";
import DatePickerField from "@/components/DatePickerField";
import FormField from "@/components/FormField";
import LoadingState, { OverlayLoading } from "@/components/LoadingState";
import TimePickerField from "@/components/TimePickerField";
import Title from "@/components/Title";
import { formInputClassName } from "@/lib/formStyles";

export default function EditSlotPage() {
  const router = useRouter();
  const params = useParams();
  const slotId = params.id as string;
  const [form, setForm] = useState({
    title: "",
    serviceName: "",
    date: "",
    startTime: "",
    endTime: "",
    capacity: "10",
  });
  const [bookedCount, setBookedCount] = useState(0);
  const [loadingSlot, setLoadingSlot] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slotId) return;
    getDoc(doc(db, "availability_slots", slotId)).then((snap) => {
      if (!snap.exists()) {
        setError("Slot not found");
        setLoadingSlot(false);
        return;
      }
      const slot = snap.data() as AvailabilitySlot;
      setForm({
        title: slot.title || "",
        serviceName: slot.serviceName || "",
        date: slot.date || "",
        startTime: slot.startTime || "",
        endTime: slot.endTime || "",
        capacity: String(slot.capacity || 10),
      });
      setBookedCount(slot.bookedCount || 0);
      setLoadingSlot(false);
    });
  }, [slotId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const updateSlot = httpsCallable(functions, "updateSlot");
      await updateSlot({
        slotId,
        ...form,
        capacity: Number(form.capacity),
      });
      router.push("/admin/slots");
    } catch (err: unknown) {
      setError(getCallableErrorMessage(err, "Failed to update slot"));
    } finally {
      setLoading(false);
    }
  };

  if (loadingSlot) {
    return <LoadingState label="Loading slot..." />;
  }

  return (
    <div className="max-w-lg mx-auto">
      {loading && <OverlayLoading label="Saving changes..." />}
      <Title heading="Edit slot" />
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
            min={bookedCount}
            placeholder="10"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            className={formInputClassName}
            required
            disabled={loading}
          />
        </FormField>
        <p className="text-sm text-gray-400">
          Current bookings: {bookedCount}. Capacity cannot be lower than this value.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3">
          <Link href="/admin/slots" className="flex-1">
            <GhostButton type="button" className="w-full justify-center py-3">
              Cancel
            </GhostButton>
          </Link>
          <PrimaryButton type="submit" className="flex-1 justify-center py-3" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
