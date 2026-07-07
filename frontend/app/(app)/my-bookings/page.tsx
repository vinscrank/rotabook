"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getCallableErrorMessage } from "@/lib/callableError";
import { Booking } from "@/types";
import { GhostButton } from "@/components/Buttons";
import FeedbackMessage from "@/components/FeedbackMessage";
import LoadingState, { OverlayLoading } from "@/components/LoadingState";
import Title from "@/components/Title";

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
      setLoadingBookings(false);
    });
    return unsub;
  }, [user]);

  const cancel = async (bookingId: string) => {
    setLoadingId(bookingId);
    setMessage("");
    setIsError(false);
    try {
      const cancelBooking = httpsCallable(functions, "cancelBooking");
      await cancelBooking({ bookingId });
      setMessage("Your booking was cancelled.");
    } catch (err: unknown) {
      setMessage(getCallableErrorMessage(err, "Could not cancel booking"));
      setIsError(true);
    } finally {
      setLoadingId(null);
    }
  };

  if (loadingBookings) {
    return <LoadingState label="Loading your bookings..." />;
  }

  return (
    <div>
      {loadingId && <OverlayLoading label="Cancelling booking..." />}
      <Title heading="My bookings" description="Your reservations update in realtime" />
      {message && (
        <FeedbackMessage message={message} variant={isError ? "error" : "success"} />
      )}
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
                {loadingId === b.id ? "Cancelling..." : "Cancel"}
              </GhostButton>
            )}
          </div>
        ))}
        {!loadingBookings && !bookings.length && <p className="text-gray-400 text-sm">No bookings yet.</p>}
      </div>
    </div>
  );
}
