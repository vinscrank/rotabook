import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";
import { requireAdmin } from "../utils/auth";
import {
  assertDateString,
  assertString,
  assertTimeRange,
  assertTimeString,
} from "../utils/validators";

export const createStaffShift = onCall({ region: "europe-west1" }, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  await requireAdmin(uid);

  const staffId = assertString(request.data?.staffId, "staffId");
  const staffName = assertString(request.data?.staffName, "staffName");
  const date = assertDateString(request.data?.date, "date");
  const startTime = assertTimeString(request.data?.startTime, "startTime");
  const endTime = assertTimeString(request.data?.endTime, "endTime");
  const role = assertString(request.data?.role, "role");

  assertTimeRange(startTime, endTime);
  const shiftRef = admin.firestore().collection("staff_shifts").doc();

  await shiftRef.set({
    staffId,
    staffName,
    date,
    startTime,
    endTime,
    role,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, shiftId: shiftRef.id };
});