import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEMO_STATS } from "@/lib/constants";

// GET /api/stats — homepage animated counters
export async function GET() {
  const [registeredPlayers, matchesPlayedAgg, winnersAgg, prizeAgg] = await Promise.all([
    db.user.count(),
    db.leaderboard.aggregate({ _sum: { matchesPlayed: true } }),
    db.leaderboard.aggregate({ _sum: { wins: true } }),
    db.leaderboard.aggregate({ _sum: { prizeEarned: true } }),
  ]);

  // Use demo baseline + real db counts so homepage always feels alive
  return NextResponse.json({
    ok: true,
    stats: {
      registeredPlayers: DEMO_STATS.registeredPlayers + registeredPlayers,
      matchesPlayed: DEMO_STATS.matchesPlayed + (matchesPlayedAgg._sum.matchesPlayed ?? 0),
      winners: DEMO_STATS.winners + (winnersAgg._sum.wins ?? 0),
      prizePool: DEMO_STATS.prizePool + (prizeAgg._sum.prizeEarned ?? 0),
    },
  });
}
