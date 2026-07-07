"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Booking } from "@/types";
import InlineLoading from "@/components/InlineLoading";
import Title from "@/components/Title";

export default function StaffBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "bookings"),
      where("staffId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
      setLoadingBookings(false);
    });
    return unsub;
  }, [user]);

  return (
    <div>
      <Title heading="Assigned bookings" />
      {loadingBookings && <InlineLoading label="Loading assigned bookings..." />}
      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="glass-panel rounded-2xl p-5">
            <p className="font-medium">{b.userName} · {b.serviceName}</p>
            <p className="text-sm text-gray-400">{b.date} · {b.startTime} - {b.endTime}</p>
            <p className="text-sm capitalize mt-1 text-violet-300">{b.status}</p>
          </div>
        ))}
        {!loadingBookings && !bookings.length && <p className="text-gray-400 text-sm">No assigned bookings.</p>}
      </div>
    </div>
  );
}
