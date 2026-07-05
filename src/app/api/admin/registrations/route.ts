import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/registrations?tournamentId=xxx
// Returns all registrations for a tournament (with user info hydrated)
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId");
    if (!tournamentId) {
      return NextResponse.json({ ok: false, error: "Missing tournamentId" }, { status: 400 });
    }

    const db = getAdminDb();
    // Fetch registrations for this tournament
    const regSnap = await db
      .collection("registrations")
      .where("tournamentId", "==", tournamentId)
      .get();

    if (regSnap.empty) {
      return NextResponse.json({ ok: true, players: [] });
    }

    // Collect unique user IDs
    const userIds = [...new Set(regSnap.docs.map((d) => d.data().userId))];

    // Hydrate user info
    const userSnaps = await Promise.all(
      userIds.map((id) => db.collection("users").doc(id).get())
    );
    const userMap = new Map(
      userSnaps.filter((s) => s.exists).map((s) => [s.id, s.data()!])
    );

    const toIso = (v: unknown): string => {
      if (v instanceof Date) return v.toISOString();
      if (v && typeof v === "object" && "_seconds" in v)
        return new Date((v as { _seconds: number })._seconds * 1000).toISOString();
      return new Date().toISOString();
    };

    const players = regSnap.docs
      .map((doc) => {
        const r = doc.data();
        const u = userMap.get(r.userId) ?? {};
        return {
          registrationId: doc.id,
          userId: r.userId,
          userName: u.name ?? "Unknown",
          userEmail: u.email ?? "",
          userPhoto: u.photoURL ?? null,
          userWalletBalance: typeof u.walletBalance === "number" ? u.walletBalance : 0,
          status: r.status,
          entryFeePaid: r.entryFeePaid ?? 0,
          createdAt: toIso(r.createdAt),
        };
      })
      // Sort: approved first, then pending, then others
      .sort((a, b) => {
        const order: Record<string, number> = { approved: 0, pending: 1, rejected: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });

    return NextResponse.json({ ok: true, players });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
