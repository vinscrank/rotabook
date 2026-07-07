import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";
import { requireAdmin } from "../utils/auth";
import {
  assertDateString,
  assertPositiveInteger,
  assertString,
  assertTimeRange,
  assertTimeString,
} from "../utils/validators";

export const updateSlot = onCall({ region: "europe-west1" }, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  await requireAdmin(uid);

  const slotId = assertString(request.data?.slotId, "slotId");
  const title = assertString(request.data?.title, "title");
  const serviceName = assertString(request.data?.serviceName, "serviceName");
  const date = assertDateString(request.data?.date, "date");
  const startTime = assertTimeString(request.data?.startTime, "startTime");
  const endTime = assertTimeString(request.data?.endTime, "endTime");
  const capacity = assertPositiveInteger(request.data?.capacity, "capacity");

  assertTimeRange(startTime, endTime);

  const slotRef = admin.firestore().collection("availability_slots").doc(slotId);
  const slotSnap = await slotRef.get();

  if (!slotSnap.exists) {
    throw new HttpsError("not-found", "Slot not found");
  }

  const slot = slotSnap.data()!;
  const bookedCount = Number.isInteger(slot.bookedCount) ? slot.bookedCount : 0;

  if (capacity < bookedCount) {
    throw new HttpsError(
      "failed-precondition",
      `Capacity cannot be lower than current bookings (${bookedCount})`
    );
  }

  const status = bookedCount >= capacity ? "full" : "available";

  await slotRef.update({
    title,
    serviceName,
    date,
    startTime,
    endTime,
    capacity,
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, slotId };
});
