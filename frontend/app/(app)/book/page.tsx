"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { getCallableErrorMessage } from "@/lib/callableError";
import { AvailabilitySlot } from "@/types";
import { PrimaryButton } from "@/components/Buttons";
import InlineLoading from "@/components/InlineLoading";
import Title from "@/components/Title";

export default function BookPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "availability_slots"),
      where("status", "==", "available"),
      orderBy("date", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setSlots(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as AvailabilitySlot))
          .filter((slot) => slot.date && slot.startTime && slot.endTime && slot.serviceName)
      );
      setLoadingSlots(false);
    });
    return unsub;
  }, []);

  const bookSlot = async (slotId: string) => {
    setLoadingId(slotId);
    setMessage("");
    setIsError(false);
    try {
      const createBooking = httpsCallable(functions, "createBooking");
      await createBooking({ slotId });
      setMessage("Booking created successfully");
      setIsError(false);
    } catch (err: unknown) {
      setMessage(getCallableErrorMessage(err, "Booking failed"));
      setIsError(true);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <Title heading="Available slots" description="Book a slot updated in realtime" />
      {message && (
        <p className={`text-sm mb-4 ${isError ? "text-red-400" : "text-violet-300"}`}>
          {message}
        </p>
      )}
      {loadingSlots && <InlineLoading label="Loading available slots..." />}
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
        {!loadingSlots && !slots.length && (
          <p className="text-gray-400 text-sm">No available slots right now.</p>
        )}
      </div>
    </div>
  );
}
