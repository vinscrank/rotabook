"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AvailabilitySlot } from "@/types";
import { PrimaryButton } from "@/components/Buttons";
import InlineLoading from "@/components/InlineLoading";
import Title from "@/components/Title";

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <Title heading="Availability slots" />
        <Link href="/admin/slots/new">
          <PrimaryButton>New slot</PrimaryButton>
        </Link>
      </div>
      {loadingSlots && <InlineLoading label="Loading slots..." />}
      <div className="space-y-4">
        {slots.map((slot) => (
          <div key={slot.id} className="glass-panel rounded-2xl p-5">
            <p className="font-medium">{slot.title}</p>
            <p className="text-sm text-gray-400">{slot.serviceName}</p>
            <p className="text-sm mt-2">{slot.date} · {slot.startTime} - {slot.endTime}</p>
            <p className="text-sm text-gray-400 mt-1">
              {slot.bookedCount}/{slot.capacity} · {slot.status}
            </p>
          </div>
        ))}
        {!loadingSlots && !slots.length && <p className="text-gray-400 text-sm">No slots created yet.</p>}
      </div>
    </div>
  );
}
