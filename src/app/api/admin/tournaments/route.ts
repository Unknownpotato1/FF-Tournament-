import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// GET /api/admin/tournaments — list all tournaments (admin)
export async function GET() {
  try {
    await requireAdmin();
    const db = getAdminDb();
    const snap = await db.collection("tournaments").orderBy("createdAt", "desc").get();
    const tournaments = snap.docs.map((doc) => {
      const t = doc.data();
      return {
        id: doc.id,
        type: t.type,
        title: t.title,
        entryFee: t.entryFee,
        prizeAmount: t.prizeAmount,
        slotLimit: t.slotLimit,
        filledSlots: t.filledSlots ?? 0,
        date: t.date instanceof Date ? t.date.toISOString() : t.date?._seconds ? new Date(t.date._seconds * 1000).toISOString() : new Date().toISOString(),
        time: t.time,
        status: t.status,
        roomPublished: t.roomPublished ?? false,
        roomId: t.roomId ?? null,
        roomPassword: t.roomPassword ?? null,
        rules: t.rules,
        winnerId: t.winnerId ?? null,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt?._seconds ? new Date(t.createdAt._seconds * 1000).toISOString() : new Date().toISOString(),
      };
    });
    return NextResponse.json({ ok: true, tournaments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// POST — create tournament
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { type, title, entryFee, prizeAmount, slotLimit, date, time, rules, roomId, roomPassword } = body;
    if (!type || !title || !entryFee || !prizeAmount || !slotLimit || !date || !time) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    const db = getAdminDb();
    const ref = await db.collection("tournaments").add({
      type,
      title,
      entryFee: Number(entryFee),
      prizeAmount: Number(prizeAmount),
      slotLimit: Number(slotLimit),
      filledSlots: 0,
      date: new Date(date),
      time,
      rules: rules ?? "Standard Free Fire Clash Squad rules apply. No hacking, no teaming, fair play only.",
      roomId: roomId ?? null,
      roomPassword: roomPassword ?? null,
      roomPublished: false,
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

    const data: Record<string, unknown> = { ...updates, updatedAt: FieldValue.serverTimestamp() };
    if (updates.date) data.date = new Date(updates.date);
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
