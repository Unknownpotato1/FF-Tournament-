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

    // NOTE: Fetch without orderBy to avoid needing composite indexes. Sort client-side.
    const [regsSnap, paysSnap, notifsSnap, prizesSnap] = await Promise.all([
      db.collection("registrations").where("userId", "==", user.uid).get(),
      db.collection("paymentRequests").where("userId", "==", user.uid).get(),
      db.collection("notifications").where("userId", "==", user.uid).limit(50).get(),
      db.collection("prizeHistory").where("userId", "==", user.uid).get(),
    ]);

    // Sort by date fields client-side (Firestore returns Timestamps)
    const sortByDateDesc = (docs: FirebaseFirestore.QueryDocumentSnapshot[], field: string) =>
      docs.sort((a, b) => {
        const av = a.data()[field];
        const bv = b.data()[field];
        const aMs = av instanceof Date ? av.getTime() : av?._seconds ? av._seconds * 1000 : 0;
        const bMs = bv instanceof Date ? bv.getTime() : bv?._seconds ? bv._seconds * 1000 : 0;
        return bMs - aMs;
      });

    const sortedRegs = sortByDateDesc([...regsSnap.docs], "createdAt");
    const sortedPays = sortByDateDesc([...paysSnap.docs], "submittedAt");
    const sortedNotifs = sortByDateDesc([...notifsSnap.docs], "createdAt").slice(0, 30);
    const sortedPrizes = sortByDateDesc([...prizesSnap.docs], "createdAt");

    // Use sorted versions from here
    const regDocs = sortedRegs;
    const payDocs = sortedPays;
    const notifDocs = sortedNotifs;
    const prizeDocs = sortedPrizes;

    // Hydrate tournaments for registrations + payments + prize history
    const tournamentIds = new Set<string>();
    regDocs.forEach((d) => tournamentIds.add(d.data().tournamentId));
    payDocs.forEach((d) => tournamentIds.add(d.data().tournamentId));
    prizeDocs.forEach((d) => tournamentIds.add(d.data().tournamentId));
    const tSnaps = await Promise.all(
      [...tournamentIds].map((id) => db.collection("tournaments").doc(id).get())
    );
    const tMap = new Map(tSnaps.filter((s) => s.exists).map((s) => [s.id, s.data()!]));

    const toIso = (v: unknown): string => {
      if (v instanceof Date) return v.toISOString();
      if (v && typeof v === "object" && "_seconds" in v) return new Date((v as { _seconds: number })._seconds * 1000).toISOString();
      return new Date().toISOString();
    };

    const registrations = regDocs.map((d) => ({ id: d.id, ...d.data() }));
    const payments = payDocs.map((d) => ({ id: d.id, ...d.data() }));

    const upcomingMatches = registrations
      .filter((r) => {
        const t = tMap.get(r.tournamentId);
        if (!t) return false;
        // Show active or started tournaments where user is approved
        if (t.status !== "active" && t.status !== "started") return false;
        if (r.status !== "approved") return false;
        return true;
      })
      .map((r) => {
        const t = tMap.get(r.tournamentId)!;
        return {
          id: r.id,
          tournamentId: r.tournamentId,
          title: t.title,
          type: t.type,
          autoStartAt: t.autoStartAt
            ? (t.autoStartAt instanceof Date
                ? t.autoStartAt.toISOString()
                : t.autoStartAt?._seconds
                ? new Date(t.autoStartAt._seconds * 1000).toISOString()
                : null)
            : null,
          status: t.status,
          roomPublished: t.roomPublished ?? false,
          roomId: t.roomPublished ? t.roomId ?? null : null,
          roomPassword: t.roomPublished ? t.roomPassword ?? null : null,
        };
      });

    const prizeByTournament = new Map<string, number>();
    prizeDocs.forEach((d) => {
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
        const t = tMap.get(r.tournamentId) ?? { title: "Unknown", type: "1v1", status: "active" };
        return {
          id: r.id,
          tournamentId: r.tournamentId,
          title: t.title,
          type: t.type,
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
      notifications: notifDocs.map((d) => {
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
      prizeHistory: prizeDocs.map((d) => {
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
          // Use tournament's createdAt as the "completed date" fallback (real completedAt isn't tracked)
          const completedDate = t.updatedAt
            ? (t.updatedAt instanceof Date
                ? t.updatedAt.toISOString()
                : t.updatedAt?._seconds
                ? new Date(t.updatedAt._seconds * 1000).toISOString()
                : new Date().toISOString())
            : new Date().toISOString();
          return {
            id: r.id,
            title: t.title,
            type: t.type,
            date: completedDate,
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
