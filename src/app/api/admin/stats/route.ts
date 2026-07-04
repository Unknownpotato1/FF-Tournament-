import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/stats — admin dashboard statistics
export async function GET() {
  try {
    await requireAdmin();
    const [
      totalUsers,
      totalRegistrations,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      activeTournaments,
      completedTournaments,
    ] = await Promise.all([
      db.user.count(),
      db.registration.count(),
      db.paymentRequest.count({ where: { status: "pending" } }),
      db.paymentRequest.count({ where: { status: "approved" } }),
      db.paymentRequest.count({ where: { status: "rejected" } }),
      db.tournament.count({ where: { status: "active" } }),
      db.tournament.count({ where: { status: "completed" } }),
    ]);
    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers,
        totalRegistrations,
        pendingPayments,
        approvedPayments,
        rejectedPayments,
        activeTournaments,
        completedTournaments,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
