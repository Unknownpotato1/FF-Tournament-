import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

// GET /api/leaderboard — top winners, most matches, highest prize
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("leaderboard")
      .orderBy("wins", "desc")
      .orderBy("prizeEarned", "desc")
      .limit(20)
      .get();

    // Hydrate user info
    const userIds = snap.docs.map((d) => d.id);
    const userSnaps = await Promise.all(userIds.map((id) => db.collection("users").doc(id).get()));
    const userMap = new Map(userSnaps.filter((s) => s.exists).map((s) => [s.id, s.data()!]));

    const all = snap.docs.map((doc) => {
      const l = doc.data();
      const u = userMap.get(doc.id) ?? {};
      return {
        userId: doc.id,
        name: u.name ?? "Player",
        photoURL: u.photoURL ?? null,
        matchesPlayed: l.matchesPlayed ?? 0,
        wins: l.wins ?? 0,
        prizeEarned: l.prizeEarned ?? 0,
      };
    });

    return NextResponse.json({
      ok: true,
      topWinners: all.slice(0, 10).map((l, i) => ({ rank: i + 1, ...l })),
      byMatches: [...all].sort((a, b) => b.matchesPlayed - a.matchesPlayed).slice(0, 10).map((l, i) => ({ rank: i + 1, name: l.name, photoURL: l.photoURL, matchesPlayed: l.matchesPlayed })),
      byPrize: [...all].sort((a, b) => b.prizeEarned - a.prizeEarned).slice(0, 10).map((l, i) => ({ rank: i + 1, name: l.name, photoURL: l.photoURL, prizeEarned: l.prizeEarned })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
