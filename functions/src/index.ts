import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { createUserProfile } from "./auth/onUserCreated";
import { createSlot } from "./slots/createSlot";
import { createBooking } from "./bookings/createBooking";
import { cancelBooking } from "./bookings/cancelBooking";
import { updateBookingStatus } from "./bookings/updateBookingStatus";
import { createStaffShift } from "./staff/createStaffShift";

export const health = onRequest({ region: "europe-west1" }, (req, res) => {
  logger.info("health check");
  res.json({ status: "ok", service: "rotabook-functions" });
});

export {
  createUserProfile,
  createSlot,
  createBooking,
  cancelBooking,
  updateBookingStatus,
  createStaffShift,
};