"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { AvailabilitySlot } from "@/types";
import { PrimaryButton } from "@/components/Buttons";
import Title from "@/components/Title";

export default function BookPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "availability_slots"),
      where("status", "==", "available"),
      orderBy("date", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AvailabilitySlot)));
    });
    return unsub;
  }, []);

  const bookSlot = async (slotId: string) => {
    setLoadingId(slotId);
    setMessage("");
    try {
      const createBooking = httpsCallable(functions, "createBooking");
      await createBooking({ slotId });
      setMessage("Booking created successfully");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage(e.message || "Booking failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <Title heading="Available slots" description="Book a slot updated in realtime" />
      {message && <p className="text-sm text-violet-300 mb-4">{message}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {slots.map((slot) => (
          <div key={slot.id} className="glass-panel rounded-2xl p-5">
            <h3 className="font-semibold text-lg">{slot.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{slot.serviceName}</p>
            <p className="text-sm mt-3">{slot.date} · {slot.startTime} - {slot.endTime}</p>
            <p className="text-sm text-gray-400 mt-1">
              {slot.bookedCount}/{slot.capacity} booked
            </p>
            <PrimaryButton
              className="mt-4"
              onClick={() => bookSlot(slot.id)}
              disabled={loadingId === slot.id}
            >
              {loadingId === slot.id ? "Booking..." : "Book"}
            </PrimaryButton>
          </div>
        ))}
        {!slots.length && (
          <p className="text-gray-400 text-sm">No available slots right now.</p>
        )}
      </div>
    </div>
  );
}
