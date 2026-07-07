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

export const createSlot = onCall({ region: "europe-west1" }, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  await requireAdmin(uid);

  const title = assertString(request.data?.title, "title");
  const serviceName = assertString(request.data?.serviceName, "serviceName");
  const date = assertDateString(request.data?.date, "date");
  const startTime = assertTimeString(request.data?.startTime, "startTime");
  const endTime = assertTimeString(request.data?.endTime, "endTime");
  const capacity = assertPositiveInteger(request.data?.capacity, "capacity");

  assertTimeRange(startTime, endTime);

  const slotRef = admin.firestore().collection("availability_slots").doc();

  await slotRef.set({
    title,
    serviceName,
    date,
    startTime,
    endTime,
    capacity,
    bookedCount: 0,
    status: "available",
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, slotId: slotRef.id };
});