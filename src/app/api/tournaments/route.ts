import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

// GET /api/tournaments — list active tournaments
// NOTE: We fetch without orderBy to avoid needing composite indexes (which require
// paid Firebase project or manual index creation). Sorting is done client-side.
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("tournaments")
      .where("status", "==", "active")
      .get();

    const tournaments = snap.docs
      .map((doc) => {
        const t = doc.data();
        return {
          id: doc.id,
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
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ ok: true, tournaments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
