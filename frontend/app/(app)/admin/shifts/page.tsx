"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { StaffShift, UserProfile } from "@/types";
import { PrimaryButton } from "@/components/Buttons";
import Title from "@/components/Title";

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
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "staff_shifts"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffShift)));
    });
    return unsub;
  }, []);

  useEffect(() => {
    getDocs(query(collection(db, "users"), where("role", "==", "staff"))).then((snap) => {
      setStaff(snap.docs.map((d) => d.data() as UserProfile));
    });
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
      const e = err as { message?: string };
      setError(e.message || "Failed to create shift");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <Title heading="Staff shifts" description="Create and view staff rota" />

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 grid gap-4 md:grid-cols-2 max-w-3xl">
        <select
          value={form.staffId}
          onChange={(e) => handleStaffChange(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:col-span-2"
          required
        >
          <option value="">Select staff member</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input placeholder="Date YYYY-MM-DD" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm" required />
        <input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm" required />
        <input placeholder="Start HH:mm" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm" required />
        <input placeholder="End HH:mm" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm" required />
        {error && <p className="text-sm text-red-400 md:col-span-2">{error}</p>}
        <PrimaryButton type="submit" disabled={loading} className="md:col-span-2 justify-center py-3">
          {loading ? "Creating..." : "Create shift"}
        </PrimaryButton>
      </form>

      <div className="space-y-4">
        {shifts.map((shift) => (
          <div key={shift.id} className="glass-panel rounded-2xl p-5">
            <p className="font-medium">{shift.staffName}</p>
            <p className="text-sm text-gray-400">{shift.role}</p>
            <p className="text-sm mt-2">{shift.date} · {shift.startTime} - {shift.endTime}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
