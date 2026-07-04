import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/complete — mark tournament completed, select winner, enter prize
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { tournamentId, winnerId, prizeAmount } = await req.json();
    if (!tournamentId || !winnerId || !prizeAmount) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (tournament.status === "completed") {
      return NextResponse.json({ ok: false, error: "Already completed" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: "completed", winnerId },
      });
      await tx.prizeHistory.create({
        data: { userId: winnerId, tournamentId, amount: Number(prizeAmount) },
      });
      const lb = await tx.leaderboard.findUnique({ where: { userId: winnerId } });
      if (lb) {
        await tx.leaderboard.update({
          where: { userId: winnerId },
          data: { wins: { increment: 1 }, prizeEarned: { increment: Number(prizeAmount) } },
        });
      } else {
        await tx.leaderboard.create({
          data: { userId: winnerId, wins: 1, prizeEarned: Number(prizeAmount) },
        });
      }
      // Notify all approved registrations
      const approved = await tx.registration.findMany({
        where: { tournamentId, status: "approved" },
      });
      await tx.notification.createMany({
        data: approved.map((r) => ({
          userId: r.userId,
          title: "Tournament Completed",
          message: `${tournament.title} has ended. Check the leaderboard to see the winner!`,
          type: "tournament_completed",
        })),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
