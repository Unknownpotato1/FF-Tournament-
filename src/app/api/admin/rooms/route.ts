import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

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
      tx.update(tRef, {
        roomId,
        roomPassword,
        roomPublished: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      // Notify all approved registrations
      const approvedSnap = await tx.get(
        db.collection("registrations").where("tournamentId", "==", tournamentId).where("status", "==", "approved")
      );
      approvedSnap.forEach((regDoc) => {
        const reg = regDoc.data();
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

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
