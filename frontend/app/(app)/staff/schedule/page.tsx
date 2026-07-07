"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { StaffShift } from "@/types";
import Title from "@/components/Title";

export default function StaffSchedulePage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<StaffShift[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "staff_shifts"),
      where("staffId", "==", user.uid),
      orderBy("date", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffShift)));
    });
    return unsub;
  }, [user]);

  return (
    <div>
      <Title heading="My schedule" description="Your upcoming shifts" />
      <div className="space-y-4">
        {shifts.map((shift) => (
          <div key={shift.id} className="glass-panel rounded-2xl p-5">
            <p className="font-medium">{shift.role}</p>
            <p className="text-sm mt-2">{shift.date} · {shift.startTime} - {shift.endTime}</p>
          </div>
        ))}
        {!shifts.length && <p className="text-gray-400 text-sm">No shifts assigned.</p>}
      </div>
    </div>
  );
}
