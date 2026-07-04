import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/leaderboard — top winners, most matches, highest prize
export async function GET() {
  const top = await db.leaderboard.findMany({
    orderBy: [{ wins: "desc" }, { prizeEarned: "desc" }],
    take: 20,
    include: { user: { select: { name: true, photoURL: true, email: true } } },
  });

  const byMatches = [...top].sort((a, b) => b.matchesPlayed - a.matchesPlayed).slice(0, 10);
  const byPrize = [...top].sort((a, b) => b.prizeEarned - a.prizeEarned).slice(0, 10);

  return NextResponse.json({
    ok: true,
    topWinners: top.slice(0, 10).map((l, i) => ({
      rank: i + 1,
      userId: l.userId,
      name: l.user.name,
      photoURL: l.user.photoURL,
      wins: l.wins,
      matchesPlayed: l.matchesPlayed,
      prizeEarned: l.prizeEarned,
    })),
    byMatches: byMatches.map((l, i) => ({
      rank: i + 1,
      name: l.user.name,
      photoURL: l.user.photoURL,
      matchesPlayed: l.matchesPlayed,
    })),
    byPrize: byPrize.map((l, i) => ({
      rank: i + 1,
      name: l.user.name,
      photoURL: l.user.photoURL,
      prizeEarned: l.prizeEarned,
    })),
  });
}
