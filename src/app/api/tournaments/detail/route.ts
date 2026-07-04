import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/tournaments/detail?id=... — get single tournament with user's registration status
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const tournament = await db.tournament.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  });
  if (!tournament) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const user = await getCurrentUser();
  let myRegistration: { status: string; roomId?: string | null; roomPassword?: string | null } | null = null;
  let paymentStatus: string | null = null;

  if (user) {
    const reg = await db.registration.findFirst({
      where: { tournamentId: id, userId: user.id },
      include: { payment: true },
    });
    if (reg) {
      myRegistration = {
        status: reg.status,
        roomId: tournament.roomPublished && reg.status === "approved" ? tournament.roomId : null,
        roomPassword: tournament.roomPublished && reg.status === "approved" ? tournament.roomPassword : null,
      };
      paymentStatus = reg.payment?.status ?? null;
    }
  }

  return NextResponse.json({
    ok: true,
    tournament: {
      id: tournament.id,
      type: tournament.type,
      title: tournament.title,
      entryFee: tournament.entryFee,
      prizeAmount: tournament.prizeAmount,
      slotLimit: tournament.slotLimit,
      filledSlots: tournament.filledSlots,
      remainingSlots: Math.max(0, tournament.slotLimit - tournament.filledSlots),
      date: tournament.date.toISOString(),
      time: tournament.time,
      status: tournament.status,
      rules: tournament.rules,
      roomPublished: tournament.roomPublished,
    },
    myRegistration,
    paymentStatus,
  });
}
