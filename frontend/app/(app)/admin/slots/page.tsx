"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AvailabilitySlot } from "@/types";
import { GhostButton, PrimaryButton } from "@/components/Buttons";
import LoadingState from "@/components/LoadingState";
import Title from "@/components/Title";

const statusStyles: Record<AvailabilitySlot["status"], string> = {
  available: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  full: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-400/30",
};

export default function AdminSlotsPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "availability_slots"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AvailabilitySlot)));
      setLoadingSlots(false);
    });
    return unsub;
  }, []);

  if (loadingSlots) {
    return <LoadingState label="Loading slots..." />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <Title heading="Availability slots" />
        <Link href="/admin/slots/new">
          <PrimaryButton className="w-full sm:w-auto justify-center">New slot</PrimaryButton>
        </Link>
      </div>
      <div className="space-y-4 max-w-3xl mx-auto">
        {slots.map((slot) => (
          <div key={slot.id} className="glass-panel rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="font-medium">{slot.title}</p>
                <p className="text-sm text-gray-400 mt-1">{slot.serviceName}</p>
                <p className="text-sm mt-2">{slot.date} · {slot.startTime} - {slot.endTime}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {slot.bookedCount}/{slot.capacity} booked
                </p>
              </div>
              <span className={`inline-flex w-fit capitalize text-xs font-medium px-3 py-1 rounded-full border ${statusStyles[slot.status]}`}>
                {slot.status}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <Link href={`/admin/slots/${slot.id}/edit`}>
                <GhostButton className="w-full sm:w-auto justify-center">Edit slot</GhostButton>
              </Link>
            </div>
          </div>
        ))}
        {!slots.length && <p className="text-gray-400 text-sm">No slots created yet.</p>}
      </div>
    </div>
  );
}
