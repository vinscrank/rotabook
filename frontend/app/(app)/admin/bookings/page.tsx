"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { Booking } from "@/types";
import { GhostButton } from "@/components/Buttons";
import Title from "@/components/Title";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
    });
    return unsub;
  }, []);

  const updateStatus = async (bookingId: string, status: string) => {
    setLoadingId(bookingId);
    try {
      const fn = httpsCallable(functions, "updateBookingStatus");
      await fn({ bookingId, status });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <Title heading="All bookings" description="Manage booking statuses" />
      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="glass-panel rounded-2xl p-5">
            <p className="font-medium">{b.userName} · {b.serviceName}</p>
            <p className="text-sm text-gray-400">{b.date} · {b.startTime} - {b.endTime}</p>
            <p className="text-sm capitalize mt-1 text-violet-300">{b.status}</p>
            <div className="flex gap-2 mt-4 flex-wrap">
              {(["confirmed", "completed", "cancelled"] as const).map((status) => (
                <GhostButton
                  key={status}
                  onClick={() => updateStatus(b.id, status)}
                  disabled={loadingId === b.id}
                >
                  {status}
                </GhostButton>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
