// Server-side push notification helper using web-push library
// Used to send real push notifications to users' devices

import webpush from "web-push";
import { getAdminDb } from "@/lib/firebase-admin";

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars."
    );
  }

  webpush.setVapidDetails(
    "mailto:support@fftournament.in",
    publicKey,
    privateKey
  );
  initialized = true;
}

type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: { url?: string };
};

/**
 * Send a push notification to a specific user.
 * Fetches all their push subscriptions from Firestore and sends to each.
 * Silently fails if user has no subscriptions or push isn't configured.
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<void> {
  try {
    ensureInitialized();

    const db = getAdminDb();
    // Fetch user's push subscriptions
    const subSnap = await db
      .collection("pushSubscriptions")
      .where("userId", "==", userId)
      .get();

    if (subSnap.empty) return; // User hasn't enabled notifications

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/icon-192.png",
      tag: payload.tag || "ff-tournament",
      data: payload.data || { url: "/" },
      requireInteraction: false,
      vibrate: [200, 100, 200],
    });

    const promises: Promise<void>[] = [];
    subSnap.forEach((doc) => {
      const subData = doc.data();
      const subscription = {
        endpoint: subData.endpoint,
        keys: subData.keys,
      };
      promises.push(
        webpush
          .sendNotification(subscription, pushPayload)
          .catch((err) => {
            // If subscription expired (410 Gone), delete it
            if (err.statusCode === 410 || err.statusCode === 404) {
              doc.ref.delete().catch(() => {});
            }
          })
      );
    });

    await Promise.all(promises);
  } catch {
    // Silent fail — push is best-effort
  }
}

/**
 * Send push notification to multiple users at once.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  const uniqueIds = [...new Set(userIds)];
  await Promise.all(uniqueIds.map((uid) => sendPushNotification(uid, payload)));
}
