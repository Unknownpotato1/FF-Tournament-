import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";

// GET /api/dashboard — current user's dashboard data
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const db = getAdminDb();

    // Ensure leaderboard entry exists
    const lbRef = db.collection("leaderboard").doc(user.uid);
    const lbSnap = await lbRef.get();
    if (!lbSnap.exists) {
      await lbRef.set({ userId: user.uid, matchesPlayed: 0, wins: 0, prizeEarned: 0 });
    }
    const leaderboard = lbSnap.exists ? lbSnap.data()! : { matchesPlayed: 0, wins: 0, prizeEarned: 0 };

    const [regsSnap, paysSnap, notifsSnap, prizesSnap] = await Promise.all([
      db.collection("registrations").where("userId", "==", user.uid).orderBy("createdAt", "desc").get(),
      db.collection("paymentRequests").where("userId", "==", user.uid).orderBy("submittedAt", "desc").get(),
      db.collection("notifications").where("userId", "==", user.uid).orderBy("createdAt", "desc").limit(30).get(),
      db.collection("prizeHistory").where("userId", "==", user.uid).orderBy("createdAt", "desc").get(),
    ]);

    // Hydrate tournaments for registrations + payments + prize history
    const tournamentIds = new Set<string>();
    regsSnap.docs.forEach((d) => tournamentIds.add(d.data().tournamentId));
    paysSnap.docs.forEach((d) => tournamentIds.add(d.data().tournamentId));
    prizesSnap.docs.forEach((d) => tournamentIds.add(d.data().tournamentId));
    const tSnaps = await Promise.all(
      [...tournamentIds].map((id) => db.collection("tournaments").doc(id).get())
    );
    const tMap = new Map(tSnaps.filter((s) => s.exists).map((s) => [s.id, s.data()!]));

    const toIso = (v: unknown): string => {
      if (v instanceof Date) return v.toISOString();
      if (v && typeof v === "object" && "_seconds" in v) return new Date((v as { _seconds: number })._seconds * 1000).toISOString();
      return new Date().toISOString();
    };

    const registrations = regsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const payments = paysSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const upcomingMatches = registrations
      .filter((r) => {
        const t = tMap.get(r.tournamentId);
        if (!t || t.status !== "active" || r.status !== "approved") return false;
        const matchDate = new Date(toIso(t.date));
        return matchDate.getTime() >= Date.now() - 86400000;
      })
      .map((r) => {
        const t = tMap.get(r.tournamentId)!;
        return {
          id: r.id,
          tournamentId: r.tournamentId,
          title: t.title,
          type: t.type,
          date: toIso(t.date),
          time: t.time,
          roomPublished: t.roomPublished ?? false,
          roomId: t.roomPublished ? t.roomId ?? null : null,
          roomPassword: t.roomPublished ? t.roomPassword ?? null : null,
        };
      });

    const prizeByTournament = new Map<string, number>();
    prizesSnap.docs.forEach((d) => {
      const p = d.data();
      prizeByTournament.set(p.tournamentId, p.amount);
    });

    return NextResponse.json({
      ok: true,
      profile: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        registeredAt: user.registeredAt,
      },
      stats: {
        matchesPlayed: leaderboard.matchesPlayed ?? 0,
        wins: leaderboard.wins ?? 0,
        prizeEarned: leaderboard.prizeEarned ?? 0,
      },
      upcomingMatches,
      joinedTournaments: registrations.map((r) => {
        const t = tMap.get(r.tournamentId) ?? { title: "Unknown", type: "1v1", date: new Date(), time: "", status: "active" };
        return {
          id: r.id,
          tournamentId: r.tournamentId,
          title: t.title,
          type: t.type,
          date: toIso(t.date),
          time: t.time,
          status: r.status,
          tournamentStatus: t.status,
        };
      }),
      payments: payments.map((p) => {
        const t = tMap.get(p.tournamentId) ?? { title: "Unknown" };
        return {
          id: p.id,
          tournamentTitle: t.title,
          amount: p.amount,
          status: p.status,
          submittedAt: toIso(p.submittedAt),
          utrNumber: p.utrNumber,
        };
      }),
      notifications: notifsSnap.docs.map((d) => {
        const n = d.data();
        return {
          id: d.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read ?? false,
          createdAt: toIso(n.createdAt),
        };
      }),
      prizeHistory: prizesSnap.docs.map((d) => {
        const p = d.data();
        const t = tMap.get(p.tournamentId) ?? { title: "Tournament", type: "1v1" };
        return {
          id: d.id,
          tournamentTitle: t.title,
          tournamentType: t.type,
          amount: p.amount,
          date: toIso(p.createdAt),
        };
      }),
      matchHistory: registrations
        .filter((r) => {
          const t = tMap.get(r.tournamentId);
          return t && t.status === "completed";
        })
        .map((r) => {
          const t = tMap.get(r.tournamentId)!;
          return {
            id: r.id,
            title: t.title,
            type: t.type,
            date: toIso(t.date),
            result: t.winnerId === user.uid ? "Won" : "Lost",
            prize: t.winnerId === user.uid ? prizeByTournament.get(r.tournamentId) ?? 0 : 0,
          };
        }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
