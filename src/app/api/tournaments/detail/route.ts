import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { processPendingAutoPublish } from "@/app/api/registrations/route";

// GET /api/tournaments/detail?id=... — single tournament + my registration status
export async function GET(req: Request) {
  try {
    // Lazy auto-publish
    await processPendingAutoPublish();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const db = getAdminDb();
    const tSnap = await db.collection("tournaments").doc(id).get();
    if (!tSnap.exists) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const t = tSnap.data()!;

    const toIsoOrNull = (v: unknown): string | null => {
      if (!v) return null;
      if (v instanceof Date) return v.toISOString();
      if (v && typeof v === "object" && "_seconds" in v) return new Date((v as { _seconds: number })._seconds * 1000).toISOString();
      return null;
    };

    const tournament = {
      id: tSnap.id,
      type: t.type,
      title: t.title,
      entryFee: t.entryFee,
      prizeAmount: t.prizeAmount,
      slotLimit: t.slotLimit,
      filledSlots: t.filledSlots ?? 0,
      remainingSlots: Math.max(0, (t.slotLimit ?? 0) - (t.filledSlots ?? 0)),
      autoStartAt: toIsoOrNull(t.autoStartAt),
      autoRoomPublishAt: toIsoOrNull(t.autoRoomPublishAt),
      status: t.status,
      rules: t.rules,
      roomPublished: t.roomPublished ?? false,
    };

    let myRegistration: { status: string; roomId: string | null; roomPassword: string | null } | null = null;
    let paymentStatus: string | null = null;

    const user = await getCurrentUser();
    if (user) {
      // Single where + client filter (avoids composite index)
      const regSnap = await db
        .collection("registrations")
        .where("tournamentId", "==", id)
        .limit(50)
        .get();
      const regDoc = regSnap.docs.find((d) => d.data().userId === user.uid);

      if (regDoc) {
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
