import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/stats — admin dashboard statistics
export async function GET() {
  try {
    await requireAdmin();
    const db = getAdminDb();

    const [usersSnap, regsSnap, pendingSnap, approvedSnap, rejectedSnap, activeSnap, completedSnap] =
      await Promise.all([
        db.collection("users").count().get(),
        db.collection("registrations").count().get(),
        db.collection("paymentRequests").where("status", "==", "pending").count().get(),
        db.collection("paymentRequests").where("status", "==", "approved").count().get(),
        db.collection("paymentRequests").where("status", "==", "rejected").count().get(),
        db.collection("tournaments").where("status", "==", "active").count().get(),
        db.collection("tournaments").where("status", "==", "completed").count().get(),
      ]);

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers: usersSnap.data().count,
        totalRegistrations: regsSnap.data().count,
        pendingPayments: pendingSnap.data().count,
        approvedPayments: approvedSnap.data().count,
        rejectedPayments: rejectedSnap.data().count,
        activeTournaments: activeSnap.data().count,
        completedTournaments: completedSnap.data().count,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
