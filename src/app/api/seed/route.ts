import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// POST /api/seed — seed demo tournaments (idempotent)
export async function POST() {
  try {
    const db = getAdminDb();

    // Only seed if there are zero tournaments
    const existingSnap = await db.collection("tournaments").limit(1).get();
    if (!existingSnap.empty) {
      return NextResponse.json({ ok: true, message: "Tournaments already exist — skipping seed" });
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const dayAfter = new Date(now.getTime() + 2 * 86400000);
    const inThreeDays = new Date(now.getTime() + 3 * 86400000);

    const tournaments = [
      {
        type: "1v1",
        title: "Solo Clash Squad #1",
        entryFee: 20,
        prizeAmount: 100,
        slotLimit: 48,
        filledSlots: 0,
        date: tomorrow,
        time: "20:00",
        rules: "Standard 1v1 Clash Squad rules. No hacking. Best of 1 round. Booyah wins.",
        status: "active",
        roomId: null,
        roomPassword: null,
        roomPublished: false,
        winnerId: null,
      },
      {
        type: "1v1",
        title: "Pro Solo Showdown",
        entryFee: 50,
        prizeAmount: 500,
        slotLimit: 32,
        filledSlots: 0,
        date: dayAfter,
        time: "21:00",
        rules: "Pro 1v1 rules. BR mode. Top fragger wins. No teaming allowed.",
        status: "active",
        roomId: null,
        roomPassword: null,
        roomPublished: false,
        winnerId: null,
      },
      {
        type: "2v2",
        title: "Duo Clash Squad Cup",
        entryFee: 30,
        prizeAmount: 300,
        slotLimit: 24,
        filledSlots: 0,
        date: tomorrow,
        time: "19:00",
        rules: "2v2 Clash Squad. Both teammates must be registered. Best of 3 rounds.",
        status: "active",
        roomId: null,
        roomPassword: null,
        roomPublished: false,
        winnerId: null,
      },
      {
        type: "2v2",
        title: "Weekend Duo Championship",
        entryFee: 100,
        prizeAmount: 1500,
        slotLimit: 16,
        filledSlots: 0,
        date: inThreeDays,
        time: "18:00",
        rules: "Premier 2v2 tournament. Single elimination. Final = Bo5.",
        status: "active",
        roomId: null,
        roomPassword: null,
        roomPublished: false,
        winnerId: null,
      },
    ];

    const batch = db.batch();
    tournaments.forEach((t) => {
      const ref = db.collection("tournaments").doc();
      batch.set(ref, { ...t, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    });
    await batch.commit();

    return NextResponse.json({ ok: true, message: `Seeded ${tournaments.length} tournaments` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
