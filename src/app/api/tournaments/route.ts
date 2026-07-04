import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { processPendingAutoPublish } from "@/app/api/registrations/route";

// GET /api/tournaments — list active tournaments (open for registration)
// Also includes "started" tournaments so users can see matches in progress.
// NOTE: Slot-based auto-start — no date/time fields used.
export async function GET() {
  try {
    // Lazy auto-publish: if any tournament's autoRoomPublishAt has passed, publish it now
    await processPendingAutoPublish();

    const db = getAdminDb();
    const snap = await db
      .collection("tournaments")
      .where("status", "in", ["active", "started"])
      .get();

    const toIsoOrNull = (v: unknown): string | null => {
      if (!v) return null;
      if (v instanceof Date) return v.toISOString();
      if (v && typeof v === "object" && "_seconds" in v) return new Date((v as { _seconds: number })._seconds * 1000).toISOString();
      return null;
    };

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
          autoStartAt: toIsoOrNull(t.autoStartAt),
          autoRoomPublishAt: toIsoOrNull(t.autoRoomPublishAt),
          status: t.status,
          rules: t.rules,
          roomPublished: t.roomPublished ?? false,
          createdAt: t.createdAt instanceof Date
            ? t.createdAt.toISOString()
            : t.createdAt?._seconds
            ? new Date(t.createdAt._seconds * 1000).toISOString()
            : new Date().toISOString(),
        };
      })
      // Active (open) first, then started (in progress)
      .sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (a.status !== "active" && b.status === "active") return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    return NextResponse.json({ ok: true, tournaments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
