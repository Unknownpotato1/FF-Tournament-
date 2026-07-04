import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// GET /api/notifications — current user's notifications
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const db = getAdminDb();
    // Fetch without orderBy (avoids composite index requirement), sort client-side
    const snap = await db
      .collection("notifications")
      .where("userId", "==", user.uid)
      .limit(100)
      .get();

    const notifications = snap.docs
      .map((doc) => {
        const n = doc.data();
        const createdAt = n.createdAt instanceof Date
          ? n.createdAt.toISOString()
          : n.createdAt?._seconds
          ? new Date(n.createdAt._seconds * 1000).toISOString()
          : new Date().toISOString();
        return { doc, createdAt, ms: new Date(createdAt).getTime() };
      })
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 50)
      .map(({ doc, createdAt }) => {
        const n = doc.data();
        return {
          id: doc.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read ?? false,
          createdAt,
        };
      });

    return NextResponse.json({ ok: true, notifications });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// POST /api/notifications — mark all as read
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const db = getAdminDb();
    // Two separate where clauses need a composite index. Fetch by userId only,
    // then filter client-side for read==false.
    const snap = await db
      .collection("notifications")
      .where("userId", "==", user.uid)
      .get();

    const batch = db.batch();
    snap.docs
      .filter((doc) => !(doc.data().read ?? false))
      .forEach((doc) => batch.update(doc.ref, { read: true, readAt: FieldValue.serverTimestamp() }));
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
