import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { DEMO_STATS } from "@/lib/constants";

// GET /api/stats — homepage animated counters (demo baseline + real db counts)
export async function GET() {
  try {
    const db = getAdminDb();
    const [usersSnap, lbSnap] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("leaderboard").get(),
    ]);

    let matchesPlayed = 0;
    let wins = 0;
    let prizeEarned = 0;
    lbSnap.forEach((doc) => {
      const l = doc.data();
      matchesPlayed += l.matchesPlayed ?? 0;
      wins += l.wins ?? 0;
      prizeEarned += l.prizeEarned ?? 0;
    });

    return NextResponse.json({
      ok: true,
      stats: {
        registeredPlayers: DEMO_STATS.registeredPlayers + usersSnap.data().count,
        matchesPlayed: DEMO_STATS.matchesPlayed + matchesPlayed,
        winners: DEMO_STATS.winners + wins,
        prizePool: DEMO_STATS.prizePool + prizeEarned,
      },
    });
  } catch (e) {
    // Fail gracefully — homepage should still render
    return NextResponse.json({ ok: true, stats: DEMO_STATS });
  }
}
