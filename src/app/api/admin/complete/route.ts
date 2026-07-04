import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// POST /api/admin/complete — mark tournament completed + select winner + enter prize
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { tournamentId, winnerId, prizeAmount } = await req.json();
    if (!tournamentId || !winnerId || !prizeAmount) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    const db = getAdminDb();
    const tRef = db.collection("tournaments").doc(tournamentId);
    const tSnap = await tRef.get();
    if (!tSnap.exists) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const tournament = tSnap.data()!;
    if (tournament.status === "completed") {
      return NextResponse.json({ ok: false, error: "Already completed" }, { status: 400 });
    }

    await db.runTransaction(async (tx) => {
      // Firestore transactions require ALL reads BEFORE any writes.
      // 1. Read registrations first
      const regSnap = await tx.get(
        db.collection("registrations").where("tournamentId", "==", tournamentId)
      );
      // 2. Then perform all writes
      tx.update(tRef, {
        status: "completed",
        winnerId,
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.create(db.collection("prizeHistory").doc(), {
        userId: winnerId,
        tournamentId,
        amount: Number(prizeAmount),
        createdAt: FieldValue.serverTimestamp(),
      });

      tx.set(
        db.collection("leaderboard").doc(winnerId),
        {
          userId: winnerId,
          wins: FieldValue.increment(1),
          prizeEarned: FieldValue.increment(Number(prizeAmount)),
        },
        { merge: true }
      );

      regSnap.forEach((regDoc) => {
        const reg = regDoc.data();
        if (reg.status !== "approved") return; // skip non-approved
        tx.create(db.collection("notifications").doc(), {
          userId: reg.userId,
          title: "Tournament Completed",
          message: `${tournament.title} has ended. Check the leaderboard to see the winner!`,
          type: "tournament_completed",
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
