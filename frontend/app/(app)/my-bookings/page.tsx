"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Booking } from "@/types";
import { GhostButton } from "@/components/Buttons";
import Title from "@/components/Title";

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
    });
    return unsub;
  }, [user]);

  const cancel = async (bookingId: string) => {
    setLoadingId(bookingId);
    try {
      const cancelBooking = httpsCallable(functions, "cancelBooking");
      await cancelBooking({ bookingId });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <Title heading="My bookings" description="Your reservations update in realtime" />
      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium">{b.serviceName}</p>
              <p className="text-sm text-gray-400">{b.date} · {b.startTime} - {b.endTime}</p>
              <p className="text-sm capitalize mt-1 text-violet-300">{b.status}</p>
            </div>
            {(b.status === "pending" || b.status === "confirmed") && (
              <GhostButton onClick={() => cancel(b.id)} disabled={loadingId === b.id}>
                Cancel
              </GhostButton>
            )}
          </div>
        ))}
        {!bookings.length && <p className="text-gray-400 text-sm">No bookings yet.</p>}
      </div>
    </div>
  );
}
