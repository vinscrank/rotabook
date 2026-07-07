"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { StaffShift, UserProfile } from "@/types";
import { PrimaryButton } from "@/components/Buttons";
import { getCallableErrorMessage } from "@/lib/callableError";
import DatePickerField from "@/components/DatePickerField";
import FormField from "@/components/FormField";
import InlineLoading from "@/components/InlineLoading";
import { OverlayLoading } from "@/components/LoadingState";
import TimePickerField from "@/components/TimePickerField";
import Title from "@/components/Title";
import { formInputClassName, formSelectClassName } from "@/lib/formStyles";

export default function AdminShiftsPage() {
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [form, setForm] = useState({
    staffId: "",
    staffName: "",
    date: "",
    startTime: "",
    endTime: "",
    role: "instructor",
  });
  const [loading, setLoading] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "staff_shifts"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffShift)));
      setLoadingShifts(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    getDocs(query(collection(db, "users"), where("role", "==", "staff")))
      .then((snap) => {
        setStaff(snap.docs.map((d) => d.data() as UserProfile));
      })
      .finally(() => setLoadingStaff(false));
  }, []);

  const handleStaffChange = (staffId: string) => {
    const member = staff.find((s) => s.id === staffId);
    setForm({ ...form, staffId, staffName: member?.name || "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fn = httpsCallable(functions, "createStaffShift");
      await fn(form);
      setForm({ staffId: "", staffName: "", date: "", startTime: "", endTime: "", role: "instructor" });
    } catch (err: unknown) {
      setError(getCallableErrorMessage(err, "Failed to create shift"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {(loading || loadingStaff) && (
        <OverlayLoading label={loading ? "Creating shift..." : "Loading staff..."} />
      )}
      <Title heading="Staff shifts" description="Create and view staff rota" />

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <FormField label="Staff member">
          <select
            value={form.staffId}
            onChange={(e) => handleStaffChange(e.target.value)}
            className={formSelectClassName}
            disabled={loadingStaff || loading}
            required
          >
            <option value="">{loadingStaff ? "Loading staff..." : "Select staff member"}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </FormField>

        <div className="grid gap-6 md:grid-cols-2">
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
          <FormField label="Role">
            <input
              placeholder="e.g. instructor"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={formInputClassName}
              required
              disabled={loading}
            />
          </FormField>
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

        {error && <p className="text-sm text-red-400">{error}</p>}
        <PrimaryButton type="submit" disabled={loading} className="w-full justify-center py-3">
          {loading ? "Creating..." : "Create shift"}
        </PrimaryButton>
      </form>

      <div className="space-y-4 max-w-3xl mx-auto">
        {loadingShifts ? (
          <InlineLoading label="Loading shifts..." variant="page" />
        ) : (
          <>
        {shifts.map((shift) => (
          <div key={shift.id} className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium">{shift.staffName}</p>
              <p className="text-sm text-gray-400 capitalize">{shift.role}</p>
            </div>
            <p className="text-sm text-violet-300">{shift.date} · {shift.startTime} - {shift.endTime}</p>
          </div>
        ))}
        {!shifts.length && <p className="text-gray-400 text-sm">No shifts created yet.</p>}
          </>
        )}
      </div>
    </div>
  );
}
