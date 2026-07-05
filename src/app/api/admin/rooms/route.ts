import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { sendPushNotification } from "@/lib/push";

// POST /api/admin/rooms — publish room details
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { tournamentId, roomId, roomPassword } = await req.json();
    if (!tournamentId || !roomId || !roomPassword) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }
    const db = getAdminDb();
    const tRef = db.collection("tournaments").doc(tournamentId);
    const tSnap = await tRef.get();
    if (!tSnap.exists) return NextResponse.json({ ok: false, error: "Tournament not found" }, { status: 404 });
    const tournament = tSnap.data()!;

    await db.runTransaction(async (tx) => {
      // Firestore transactions require ALL reads BEFORE any writes.
      // 1. Read registrations first
      const regSnap = await tx.get(
        db.collection("registrations").where("tournamentId", "==", tournamentId)
      );
      // 2. Then perform all writes
      tx.update(tRef, {
        roomId,
        roomPassword,
        roomPublished: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      regSnap.forEach((regDoc) => {
        const reg = regDoc.data();
        if (reg.status !== "approved") return; // skip non-approved
        tx.create(db.collection("notifications").doc(), {
          userId: reg.userId,
          title: "Room Details Published",
          message: `Room ID & Password for ${tournament.title} are now available in your dashboard.`,
          type: "room_published",
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
    });

    // Send push notifications to all approved players
    const pushSnap = await db.collection("registrations").where("tournamentId", "==", tournamentId).get();
    const approvedUserIds: string[] = [];
    pushSnap.forEach((doc) => {
      const reg = doc.data();
      if (reg.status === "approved") approvedUserIds.push(reg.userId);
    });
    for (const uid of approvedUserIds) {
      await sendPushNotification(uid, {
        title: "🔑 Room Details Published!",
        body: `Room ID & Password for ${tournament.title} are now available in your dashboard. Match starting!`,
        tag: "room_published",
        data: { url: "/" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
