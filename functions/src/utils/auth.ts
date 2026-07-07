import { HttpsError } from "firebase-functions/v2/https";
import { admin } from "../admin";

export async function requireAdmin(uid: string): Promise<void> {
  const userDoc = await admin.firestore().collection("users").doc(uid).get();

  if (!userDoc.exists) {
    throw new HttpsError("permission-denied", "User profile not found");
  }

  const role = userDoc.data()?.role;

  if (role !== "admin") {
    throw new HttpsError("permission-denied", "Admin role required");
  }
}

export async function getUserProfile(uid: string) {
  const userDoc = await admin.firestore().collection("users").doc(uid).get();

  if (!userDoc.exists) {
    throw new HttpsError("permission-denied", "User profile not found");
  }

  return userDoc.data() as {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}