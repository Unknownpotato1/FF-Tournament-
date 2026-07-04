import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";

// GET /api/tournaments/detail?id=... — single tournament + my registration status
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const db = getAdminDb();
    const tSnap = await db.collection("tournaments").doc(id).get();
    if (!tSnap.exists) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const t = tSnap.data()!;

    const tournament = {
      id: tSnap.id,
      type: t.type,
      title: t.title,
      entryFee: t.entryFee,
      prizeAmount: t.prizeAmount,
      slotLimit: t.slotLimit,
      filledSlots: t.filledSlots ?? 0,
      remainingSlots: Math.max(0, (t.slotLimit ?? 0) - (t.filledSlots ?? 0)),
      date: t.date instanceof Date ? t.date.toISOString() : new Date(t.date?._seconds * 1000 || Date.now()).toISOString(),
      time: t.time,
      status: t.status,
      rules: t.rules,
      roomPublished: t.roomPublished ?? false,
    };

    let myRegistration: { status: string; roomId: string | null; roomPassword: string | null } | null = null;
    let paymentStatus: string | null = null;

    const user = await getCurrentUser();
    if (user) {
      const regSnap = await db
        .collection("registrations")
        .where("tournamentId", "==", id)
        .where("userId", "==", user.uid)
        .limit(1)
        .get();

      if (!regSnap.empty) {
        const regDoc = regSnap.docs[0];
        const reg = regDoc.data();
        myRegistration = {
          status: reg.status,
          roomId:
            tournament.roomPublished && reg.status === "approved" ? t.roomId ?? null : null,
          roomPassword:
            tournament.roomPublished && reg.status === "approved" ? t.roomPassword ?? null : null,
        };
        // Fetch payment status
        const paySnap = await db
          .collection("paymentRequests")
          .where("registrationId", "==", regDoc.id)
          .limit(1)
          .get();
        if (!paySnap.empty) {
          paymentStatus = paySnap.docs[0].data().status;
        }
      }
    }

    return NextResponse.json({ ok: true, tournament, myRegistration, paymentStatus });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
