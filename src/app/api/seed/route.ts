import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/seed — seed demo tournaments + admin user (idempotent)
export async function POST() {
  const adminEmail = "admin@fftournament.in";
  let admin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await db.user.create({
      data: {
        uid: "admin_seed_uid",
        name: "Tournament Admin",
        email: adminEmail,
        photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=admin",
        role: "admin",
      },
    });
    await db.leaderboard.create({ data: { userId: admin.id } });
  }

  // Seed demo tournaments if none exist
  const existing = await db.tournament.count();
  if (existing === 0) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const dayAfter = new Date(now.getTime() + 2 * 86400000);
    const inThreeDays = new Date(now.getTime() + 3 * 86400000);

    await db.tournament.createMany({
      data: [
        {
          type: "1v1",
          title: "Solo Clash Squad #1",
          entryFee: 20,
          prizeAmount: 100,
          slotLimit: 48,
          date: tomorrow,
          time: "20:00",
          rules: "Standard 1v1 Clash Squad rules. No hacking. Best of 1 round. Booyah wins.",
          status: "active",
        },
        {
          type: "1v1",
          title: "Pro Solo Showdown",
          entryFee: 50,
          prizeAmount: 500,
          slotLimit: 32,
          date: dayAfter,
          time: "21:00",
          rules: "Pro 1v1 rules. BR mode. Top fragger wins. No teaming allowed.",
          status: "active",
        },
        {
          type: "2v2",
          title: "Duo Clash Squad Cup",
          entryFee: 30,
          prizeAmount: 300,
          slotLimit: 24,
          date: tomorrow,
          time: "19:00",
          rules: "2v2 Clash Squad. Both teammates must be registered. Best of 3 rounds.",
          status: "active",
        },
        {
          type: "2v2",
          title: "Weekend Duo Championship",
          entryFee: 100,
          prizeAmount: 1500,
          slotLimit: 16,
          date: inThreeDays,
          time: "18:00",
          rules: "Premier 2v2 tournament. Single elimination. Final = Bo5.",
          status: "active",
        },
      ],
    });

    // seed leaderboard demo entries
    const demoPlayers = await db.user.findMany({ take: 10 });
    let i = 1;
    for (const p of demoPlayers) {
      if (p.id === admin.id) continue;
      await db.leaderboard.upsert({
        where: { userId: p.id },
        update: {},
        create: {
          userId: p.id,
          matchesPlayed: 10 - i + 3,
          wins: 10 - i,
          prizeEarned: (10 - i) * 150,
        },
      });
      i++;
    }
  }

  return NextResponse.json({ ok: true, message: "Seed complete" });
}

// GET — quick run via browser
export async function GET() {
  return POST();
}
