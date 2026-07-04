import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/tournaments — create new tournament
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { type, title, entryFee, prizeAmount, slotLimit, date, time, rules, roomId, roomPassword } = body;
    if (!type || !title || !entryFee || !prizeAmount || !slotLimit || !date || !time) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    const t = await db.tournament.create({
      data: {
        type,
        title,
        entryFee: Number(entryFee),
        prizeAmount: Number(prizeAmount),
        slotLimit: Number(slotLimit),
        date: new Date(date),
        time,
        rules: rules ?? "Standard Free Fire Clash Squad rules apply. No hacking, no teaming, fair play only.",
        roomId: roomId ?? null,
        roomPassword: roomPassword ?? null,
      },
    });
    return NextResponse.json({ ok: true, tournamentId: t.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// PUT /api/admin/tournaments — update tournament
export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    const data: Record<string, unknown> = { ...updates };
    if (updates.date) data.date = new Date(updates.date);
    if (updates.entryFee) data.entryFee = Number(updates.entryFee);
    if (updates.prizeAmount) data.prizeAmount = Number(updates.prizeAmount);
    if (updates.slotLimit) data.slotLimit = Number(updates.slotLimit);
    await db.tournament.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// DELETE /api/admin/tournaments?id=... — delete tournament
export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    await db.tournament.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// GET /api/admin/tournaments — list all tournaments (admin only)
export async function GET() {
  try {
    await requireAdmin();
    const tournaments = await db.tournament.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { registrations: true } } },
    });
    return NextResponse.json({
      ok: true,
      tournaments: tournaments.map((t) => ({
        id: t.id,
        type: t.type,
        title: t.title,
        entryFee: t.entryFee,
        prizeAmount: t.prizeAmount,
        slotLimit: t.slotLimit,
        filledSlots: t.filledSlots,
        date: t.date.toISOString(),
        time: t.time,
        status: t.status,
        roomPublished: t.roomPublished,
        roomId: t.roomId,
        roomPassword: t.roomPassword,
        rules: t.rules,
        winnerId: t.winnerId,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
