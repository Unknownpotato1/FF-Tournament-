import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// POST /api/push/subscribe — store user's push subscription
// Body: { endpoint, keys: { p256dh, auth } }
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
    }

    const { endpoint, keys } = await req.json();
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json({ ok: false, error: "Invalid subscription" }, { status: 400 });
    }

    const db = getAdminDb();
    // Check if this endpoint already exists for this user
    const existing = await db
      .collection("pushSubscriptions")
      .where("userId", "==", user.uid)
      .where("endpoint", "==", endpoint)
      .limit(1)
      .get();

    if (!existing.empty) {
      // Already subscribed
      return NextResponse.json({ ok: true, message: "Already subscribed" });
    }

    await db.collection("pushSubscriptions").add({
      userId: user.uid,
      endpoint,
      keys,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/push/subscribe — unsubscribe
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
    }

    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ ok: false, error: "Missing endpoint" }, { status: 400 });
    }

    const db = getAdminDb();
    const snap = await db
      .collection("pushSubscriptions")
      .where("userId", "==", user.uid)
      .where("endpoint", "==", endpoint)
      .get();

    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
