"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { getCallableErrorMessage } from "@/lib/callableError";
import { Booking } from "@/types";
import { GhostButton } from "@/components/Buttons";
import LoadingState, { OverlayLoading } from "@/components/LoadingState";
import Title from "@/components/Title";

type BookingStatus = Booking["status"];
type AdminStatus = "confirmed" | "completed" | "cancelled";

const adminActions: AdminStatus[] = ["confirmed", "completed", "cancelled"];

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  confirmed: "bg-violet-500/15 text-violet-300 border-violet-400/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-400/30",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingAction, setLoadingAction] = useState<{ bookingId: string; status: AdminStatus } | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
      setLoadingBookings(false);
    });
    return unsub;
  }, []);

  const updateStatus = async (bookingId: string, status: AdminStatus) => {
    setLoadingAction({ bookingId, status });
    setMessage("");
    setIsError(false);
    try {
      const fn = httpsCallable(functions, "updateBookingStatus");
      await fn({ bookingId, status });
      setMessage(`Booking marked as ${status}.`);
    } catch (err: unknown) {
      setMessage(getCallableErrorMessage(err, "Could not update booking status"));
      setIsError(true);
    } finally {
      setLoadingAction(null);
    }
  };

  const isUpdating = (bookingId: string, status: AdminStatus) =>
    loadingAction?.bookingId === bookingId && loadingAction.status === status;

  const isRowBusy = (bookingId: string) => loadingAction?.bookingId === bookingId;

  if (loadingBookings) {
    return <LoadingState label="Loading bookings..." />;
  }

  return (
    <div>
      {loadingAction && <OverlayLoading label="Updating booking..." />}
      <Title heading="All bookings" description="Manage booking statuses" />
      {message && (
        <p className={`text-sm mb-4 ${isError ? "text-red-400" : "text-violet-300"}`}>{message}</p>
      )}
      <div className="space-y-4 max-w-3xl mx-auto">
        {bookings.map((b) => (
          <div key={b.id} className="glass-panel rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="font-medium">{b.userName} · {b.serviceName}</p>
                <p className="text-sm text-gray-400 mt-1">{b.date} · {b.startTime} - {b.endTime}</p>
              </div>
              <span className={`inline-flex w-fit capitalize text-xs font-medium px-3 py-1 rounded-full border ${statusStyles[b.status]}`}>
                {b.status}
              </span>
            </div>

            {(b.status === "pending" || b.status === "confirmed") && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">Update status</p>
                <div className="flex gap-2 flex-wrap">
                  {adminActions.map((status) => {
                    const isCurrent = b.status === status;
                    const updating = isUpdating(b.id, status);

                    return (
                      <GhostButton
                        key={status}
                        onClick={() => updateStatus(b.id, status)}
                        disabled={isCurrent || isRowBusy(b.id)}
                        className={`capitalize ${isCurrent ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {updating ? "Updating..." : status}
                      </GhostButton>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
        {!loadingBookings && !bookings.length && <p className="text-gray-400 text-sm">No bookings yet.</p>}
      </div>
    </div>
  );
}
