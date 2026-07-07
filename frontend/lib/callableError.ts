import { FirebaseError } from "firebase/app";

const friendlyMessages: Record<string, string> = {
  unauthenticated: "You must be signed in to continue.",
  "permission-denied": "Your account profile is missing or you do not have permission.",
  "not-found": "The selected slot was not found.",
  "failed-precondition": "This slot is no longer available or is already full.",
  "already-exists": "You already have an active booking for this slot.",
  internal: "The server could not complete the booking. Check Firebase function logs or wait if a Firestore index is still building.",
  "invalid-argument": "Some booking data is invalid. Refresh the page and try again.",
  unavailable: "The booking service is temporarily unavailable. Try again in a moment.",
};

export function getCallableErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof FirebaseError) {
    const code = error.code.replace(/^functions\//, "");
    const detail = error.message?.trim();

    if (detail && detail !== "INTERNAL" && detail !== code) {
      return detail;
    }

    return friendlyMessages[code] || fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
