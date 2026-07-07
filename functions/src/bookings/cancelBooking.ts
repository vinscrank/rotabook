import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";
import { requireAdmin } from "../utils/auth";
import { assertString } from "../utils/validators";

export const cancelBooking = onCall({ region: "europe-west1" }, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const bookingId = assertString(request.data?.bookingId, "bookingId");
  const bookingRef = admin.firestore().collection("bookings").doc(bookingId);

  await admin.firestore().runTransaction(async (tx) => {
    const bookingSnap = await tx.get(bookingRef);

    if (!bookingSnap.exists) {
      throw new HttpsError("not-found", "Booking not found");
    }

    const booking = bookingSnap.data()!;
    const isOwner = booking.userId === uid;

    let isAdmin = false;
    if (!isOwner) {
      try {
        await requireAdmin(uid);
        isAdmin = true;
      } catch {
        throw new HttpsError("permission-denied", "Not allowed to cancel this booking");
      }
    }

    if (!isOwner && !isAdmin) {
      throw new HttpsError("permission-denied", "Not allowed to cancel this booking");
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new HttpsError("failed-precondition", "Booking cannot be cancelled");
    }

    const slotRef = admin.firestore().collection("availability_slots").doc(booking.slotId);
    const slotSnap = await tx.get(slotRef);

    tx.update(bookingRef, {
      status: "cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (slotSnap.exists) {
      const slot = slotSnap.data()!;
      const newBookedCount = Math.max(0, slot.bookedCount - 1);

      tx.update(slotRef, {
        bookedCount: newBookedCount,
        status: "available",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return { success: true };
});