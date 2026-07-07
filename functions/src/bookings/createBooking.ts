import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";
import { getUserProfile } from "../utils/auth";
import { assertString } from "../utils/validators";

export const createBooking = onCall({ region: "europe-west1" }, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const slotId = assertString(request.data?.slotId, "slotId");

  try {
    const user = await getUserProfile(uid);

    const slotRef = admin.firestore().collection("availability_slots").doc(slotId);
    const bookingRef = admin.firestore().collection("bookings").doc();

    const duplicateQuery = admin
      .firestore()
      .collection("bookings")
      .where("userId", "==", uid)
      .where("slotId", "==", slotId);

    const bookingId = await admin.firestore().runTransaction(async (tx) => {
      const slotSnap = await tx.get(slotRef);

      if (!slotSnap.exists) {
        throw new HttpsError("not-found", "Slot not found");
      }

      const slot = slotSnap.data()!;

      if (slot.status !== "available") {
        throw new HttpsError("failed-precondition", "Slot not available");
      }

      if (slot.bookedCount >= slot.capacity) {
        throw new HttpsError("failed-precondition", "Slot is full");
      }

      const duplicateSnap = await tx.get(duplicateQuery);
      const hasActiveBooking = duplicateSnap.docs.some((doc) => {
        const status = doc.data().status;
        return status === "pending" || status === "confirmed";
      });

      if (hasActiveBooking) {
        throw new HttpsError("already-exists", "Booking already exists for this slot");
      }

      const newBookedCount = slot.bookedCount + 1;
      const newStatus = newBookedCount >= slot.capacity ? "full" : "available";

      tx.set(bookingRef, {
        userId: uid,
        userName: user.name,
        slotId,
        staffId: null,
        serviceName: slot.serviceName,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.update(slotRef, {
        bookedCount: newBookedCount,
        status: newStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return bookingRef.id;
    });

    return { success: true, bookingId };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    const detail = error instanceof Error ? error.message : "Unknown server error";
    logger.error("createBooking failed", { uid, slotId, detail });

    if (detail.includes("index") || detail.includes("FAILED_PRECONDITION")) {
      throw new HttpsError(
        "failed-precondition",
        "Firestore index missing for bookings lookup. Deploy firestore indexes and wait until they are enabled."
      );
    }

    throw new HttpsError("internal", `Booking failed: ${detail}`);
  }
});