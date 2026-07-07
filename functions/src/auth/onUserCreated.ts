import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";

export const createUserProfile = functions
  .region("europe-west1")
  .auth.user()
  .onCreate(async (user) => {
    const { uid, email, displayName } = user;
    const name = displayName?.trim() || email?.split("@")[0] || "User";

    await admin.firestore().collection("users").doc(uid).set({
      id: uid,
      name,
      email: email ?? "",
      role: "user",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("User profile created", { uid, email });
  });