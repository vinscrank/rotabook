import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";
import { requireAdmin } from "../utils/auth";
import { assertAdminBookingStatus, assertString } from "../utils/validators";

export const updateBookingStatus = onCall({ region: "europe-west1" }, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  await requireAdmin(uid);

  const bookingId = assertString(request.data?.bookingId, "bookingId");
  const status = assertAdminBookingStatus(request.data?.status);

  const bookingRef = admin.firestore().collection("bookings").doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    throw new HttpsError("not-found", "Booking not found");
  }

  await bookingRef.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});