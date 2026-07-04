import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/dashboard — current user's dashboard data
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  // Ensure leaderboard entry exists
  await db.leaderboard.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const [registrations, payments, notifications, prizeHistory, leaderboard] = await Promise.all([
    db.registration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { tournament: true },
    }),
    db.paymentRequest.findMany({
      where: { userId: user.id },
      orderBy: { submittedAt: "desc" },
      include: {
        tournament: {
          select: {
            id: true,
            title: true,
            type: true,
            date: true,
            time: true,
            status: true,
            roomPublished: true,
            roomId: true,
            roomPassword: true,
          },
        },
      },
    }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.prizeHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.leaderboard.findUnique({ where: { userId: user.id } }),
  ]);

  // Fetch tournament details for prize history separately (avoids Prisma relation cache issues)
  const tournamentIds = [...new Set(prizeHistory.map((p) => p.tournamentId))];
  const tournaments = tournamentIds.length > 0
    ? await db.tournament.findMany({ where: { id: { in: tournamentIds } }, select: { id: true, title: true, type: true, date: true } })
    : [];
  const tournamentMap = new Map(tournaments.map((t) => [t.id, t]));

  const upcomingMatches = registrations
    .filter(
      (r) =>
        r.status === "approved" &&
        r.tournament.status === "active" &&
        new Date(r.tournament.date) >= new Date(Date.now() - 86400000)
    )
    .map((r) => ({
      id: r.id,
      tournamentId: r.tournamentId,
      title: r.tournament.title,
      type: r.tournament.type,
      date: r.tournament.date.toISOString(),
      time: r.tournament.time,
      roomPublished: r.tournament.roomPublished,
      roomId: r.tournament.roomPublished ? r.tournament.roomId : null,
      roomPassword: r.tournament.roomPublished ? r.tournament.roomPassword : null,
    }));

  // Build a lookup of prize won per tournament
  const prizeByTournament = new Map<string, number>();
  for (const p of prizeHistory) {
    prizeByTournament.set(p.tournamentId, p.amount);
  }

  return NextResponse.json({
    ok: true,
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      role: user.role,
      registeredAt: user.registeredAt.toISOString(),
    },
    stats: {
      matchesPlayed: leaderboard?.matchesPlayed ?? 0,
      wins: leaderboard?.wins ?? 0,
      prizeEarned: leaderboard?.prizeEarned ?? 0,
    },
    upcomingMatches,
    joinedTournaments: registrations.map((r) => ({
      id: r.id,
      tournamentId: r.tournamentId,
      title: r.tournament.title,
      type: r.tournament.type,
      date: r.tournament.date.toISOString(),
      time: r.tournament.time,
      status: r.status,
      tournamentStatus: r.tournament.status,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      tournamentTitle: p.tournament.title,
      amount: p.amount,
      status: p.status,
      submittedAt: p.submittedAt.toISOString(),
      utrNumber: p.utrNumber,
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    prizeHistory: prizeHistory.map((p) => {
      const t = tournamentMap.get(p.tournamentId);
      return {
        id: p.id,
        tournamentTitle: t?.title ?? "Tournament",
        tournamentType: t?.type ?? "1v1",
        amount: p.amount,
        date: p.createdAt.toISOString(),
      };
    }),
    matchHistory: registrations
      .filter((r) => r.tournament.status === "completed")
      .map((r) => ({
        id: r.id,
        title: r.tournament.title,
        type: r.tournament.type,
        date: r.tournament.date.toISOString(),
        result: r.tournament.winnerId === user.id ? "Won" : "Lost",
        prize: prizeByTournament.get(r.tournamentId) ?? 0,
      })),
  });
}
