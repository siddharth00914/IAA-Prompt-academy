import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const db = getFirestore();

export const adminHealthCheck = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const profileSnap = await db.doc(`users/${request.auth.uid}`).get();
  const profile = profileSnap.data();

  if (!profileSnap.exists || profile?.role !== "admin" || profile?.active !== true) {
    throw new HttpsError("permission-denied", "Admin clearance required.");
  }

  return { ok: true as const };
});
