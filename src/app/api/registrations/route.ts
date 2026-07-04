import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// POST /api/registrations — register + submit payment
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });

    const { tournamentId, screenshotURL, utrNumber, note } = await req.json();
    if (!tournamentId || !screenshotURL || !utrNumber) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const db = getAdminDb();
    const tRef = db.collection("tournaments").doc(tournamentId);
    const tSnap = await tRef.get();
    if (!tSnap.exists) return NextResponse.json({ ok: false, error: "Tournament not found" }, { status: 404 });
    const t = tSnap.data()!;
    if (t.status !== "active") return NextResponse.json({ ok: false, error: "Tournament not active" }, { status: 400 });
    if ((t.filledSlots ?? 0) >= (t.slotLimit ?? 0)) return NextResponse.json({ ok: false, error: "Tournament is full" }, { status: 400 });

    // Check for existing registration
    const existingSnap = await db
      .collection("registrations")
      .where("tournamentId", "==", tournamentId)
      .where("userId", "==", user.uid)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      return NextResponse.json({ ok: false, error: "Already registered for this tournament" }, { status: 400 });
    }

    // Create registration + payment in a transaction
    const regId = db.collection("registrations").doc().id;
    const payId = db.collection("paymentRequests").doc().id;

    await db.runTransaction(async (tx) => {
      // Re-read tournament to ensure no race condition on slots
      const freshTSnap = await tx.get(tRef);
      if (!freshTSnap.exists) throw new Error("Tournament vanished");
      const freshT = freshTSnap.data()!;
      if ((freshT.filledSlots ?? 0) >= (freshT.slotLimit ?? 0)) throw new Error("Tournament is full");

      tx.set(db.collection("registrations").doc(regId), {
        userId: user.uid,
        tournamentId,
        status: "pending",
        note: note ?? null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.set(db.collection("paymentRequests").doc(payId), {
        userId: user.uid,
        tournamentId,
        registrationId: regId,
        screenshotURL,
        utrNumber,
        amount: t.entryFee,
        note: note ?? null,
        status: "pending",
        submittedAt: FieldValue.serverTimestamp(),
      });

      tx.update(tRef, { filledSlots: FieldValue.increment(1) });

      tx.create(db.collection("notifications").doc(), {
        userId: user.uid,
        title: "Tournament Registered",
        message: `You've registered for ${t.title}. Payment under verification.`,
        type: "tournament_registered",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true, registrationId: regId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
