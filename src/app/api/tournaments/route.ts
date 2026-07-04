import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/tournaments — list active tournaments
export async function GET() {
  const tournaments = await db.tournament.findMany({
    where: { status: "active" },
    orderBy: { date: "asc" },
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
      remainingSlots: Math.max(0, t.slotLimit - t.filledSlots),
      date: t.date.toISOString(),
      time: t.time,
      status: t.status,
      rules: t.rules,
      roomPublished: t.roomPublished,
    })),
  });
}
