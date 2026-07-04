import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// GET /api/admin/tournaments — list all tournaments (admin)
export async function GET() {
  try {
    await requireAdmin();
    const db = getAdminDb();
    // Fetch without orderBy (avoids potential index issues), sort client-side
    const snap = await db.collection("tournaments").get();

    const tournaments = snap.docs
      .map((doc) => {
        const t = doc.data();
        const createdAt = t.createdAt instanceof Date
          ? t.createdAt.toISOString()
          : t.createdAt?._seconds
          ? new Date(t.createdAt._seconds * 1000).toISOString()
          : new Date().toISOString();
        return { id: doc.id, t, createdAt, ms: new Date(createdAt).getTime() };
      })
      .sort((a, b) => b.ms - a.ms)
      .map(({ id, t, createdAt }) => {
        const toIsoOrNull = (v: unknown): string | null => {
          if (!v) return null;
          if (v instanceof Date) return v.toISOString();
          if (v && typeof v === "object" && "_seconds" in v) return new Date((v as { _seconds: number })._seconds * 1000).toISOString();
          return null;
        };
        return {
          id,
          type: t.type,
          title: t.title,
          entryFee: t.entryFee,
          prizeAmount: t.prizeAmount,
          slotLimit: t.slotLimit,
          filledSlots: t.filledSlots ?? 0,
          // Legacy fields (kept for backward compat with old data, but no longer used)
          date: toIsoOrNull(t.date) ?? null,
          time: t.time ?? null,
          // New auto-start fields
          autoStartAt: toIsoOrNull(t.autoStartAt),
          autoRoomPublishAt: toIsoOrNull(t.autoRoomPublishAt),
          status: t.status,
          roomPublished: t.roomPublished ?? false,
          roomId: t.roomId ?? null,
          roomPassword: t.roomPassword ?? null,
          rules: t.rules,
          winnerId: t.winnerId ?? null,
          createdAt,
        };
      });
    return NextResponse.json({ ok: true, tournaments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// POST — create tournament (slot-based auto-start, no date/time needed)
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { type, title, entryFee, prizeAmount, slotLimit, rules, roomId, roomPassword } = body;
    if (!type || !title || !entryFee || !prizeAmount || !slotLimit) {
      return NextResponse.json({ ok: false, error: "Missing required fields (type, title, entryFee, prizeAmount, slotLimit)" }, { status: 400 });
    }
    const db = getAdminDb();
    const ref = await db.collection("tournaments").add({
      type,
      title,
      entryFee: Number(entryFee),
      prizeAmount: Number(prizeAmount),
      slotLimit: Number(slotLimit),
      filledSlots: 0,
      // Slot-based auto-start: tournament starts when slots fill,
      // room details auto-published 5 mins after slots fill.
      // autoStartAt + autoRoomPublishAt are set when last slot fills.
      autoStartAt: null,
      autoRoomPublishAt: null,
      rules: rules ?? "Standard Free Fire Clash Squad rules apply. No hacking, no teaming, fair play only. Tournament starts automatically when all slots are filled.",
      roomId: roomId ?? null,
      roomPassword: roomPassword ?? null,
      roomPublished: false,
      // status: "active" (open for registration) | "started" (slots full, room published, in progress) | "completed" | "cancelled"
      status: "active",
      winnerId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, tournamentId: ref.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// PUT — update tournament { id, ...fields }
export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    // Strip date/time if client sends them (legacy support)
    delete updates.date;
    delete updates.time;

    const data: Record<string, unknown> = { ...updates, updatedAt: FieldValue.serverTimestamp() };
    if (updates.entryFee !== undefined) data.entryFee = Number(updates.entryFee);
    if (updates.prizeAmount !== undefined) data.prizeAmount = Number(updates.prizeAmount);
    if (updates.slotLimit !== undefined) data.slotLimit = Number(updates.slotLimit);

    const db = getAdminDb();
    await db.collection("tournaments").doc(id).update(data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// DELETE — delete tournament ?id=...
export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    const db = getAdminDb();
    await db.collection("tournaments").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
