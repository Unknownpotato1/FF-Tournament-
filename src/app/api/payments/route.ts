import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// GET /api/payments — list payments (admin: all; user: own)
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const db = getAdminDb();
    // Fetch without orderBy / multiple where (avoids composite indexes). Filter + sort client-side.
    let snap;
    if (user.role === "admin") {
      snap = await db.collection("paymentRequests").limit(200).get();
    } else {
      snap = await db.collection("paymentRequests").where("userId", "==", user.uid).limit(200).get();
    }

    // Filter by status if requested
    let docs = snap.docs;
    if (status) {
      docs = docs.filter((d) => d.data().status === status);
    }

    // Sort by submittedAt desc
    docs.sort((a, b) => {
      const av = a.data().submittedAt;
      const bv = b.data().submittedAt;
      const aMs = av instanceof Date ? av.getTime() : av?._seconds ? av._seconds * 1000 : 0;
      const bMs = bv instanceof Date ? bv.getTime() : bv?._seconds ? bv._seconds * 1000 : 0;
      return bMs - aMs;
    });

    // Hydrate user + tournament info
    const userIds = [...new Set(snap.docs.map((d) => d.data().userId))];
    const tournamentIds = [...new Set(snap.docs.map((d) => d.data().tournamentId))];
    const [userSnaps, tSnaps] = await Promise.all([
      Promise.all(userIds.map((id) => db.collection("users").doc(id).get())),
      Promise.all(tournamentIds.map((id) => db.collection("tournaments").doc(id).get())),
    ]);
    const userMap = new Map(userSnaps.filter((s) => s.exists).map((s) => [s.id, s.data()!]));
    const tMap = new Map(tSnaps.filter((s) => s.exists).map((s) => [s.id, s.data()!]));

    const payments = docs.map((doc) => {
      const p = doc.data();
      const pu = userMap.get(p.userId) ?? {};
      const pt = tMap.get(p.tournamentId) ?? {};
      return {
        id: doc.id,
        userId: p.userId,
        userName: pu.name ?? "Unknown",
        userEmail: pu.email ?? "",
        userPhoto: pu.photoURL ?? null,
        tournamentId: p.tournamentId,
        tournamentTitle: pt.title ?? "Unknown",
        tournamentType: pt.type ?? "1v1",
        tournamentStatus: pt.status ?? "active",
        filledSlots: pt.filledSlots ?? 0,
        slotLimit: pt.slotLimit ?? 0,
        screenshotURL: p.screenshotURL,
        utrNumber: p.utrNumber,
        amount: p.amount,
        note: p.note,
        status: p.status,
        submittedAt: p.submittedAt instanceof Date ? p.submittedAt.toISOString() : p.submittedAt?._seconds ? new Date(p.submittedAt._seconds * 1000).toISOString() : new Date().toISOString(),
        reviewedAt: p.reviewedAt instanceof Date ? p.reviewedAt.toISOString() : p.reviewedAt?._seconds ? new Date(p.reviewedAt._seconds * 1000).toISOString() : null,
      };
    });

    return NextResponse.json({ ok: true, payments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// POST /api/payments — admin verifies a payment { paymentId, action: "approve"|"reject" }
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { paymentId, action } = await req.json();
    if (!paymentId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    const db = getAdminDb();
    const payRef = db.collection("paymentRequests").doc(paymentId);
    const paySnap = await payRef.get();
    if (!paySnap.exists) return NextResponse.json({ ok: false, error: "Payment not found" }, { status: 404 });
    const payment = paySnap.data()!;
    if (payment.status !== "pending") return NextResponse.json({ ok: false, error: "Already reviewed" }, { status: 400 });

    const newStatus = action === "approve" ? "approved" : "rejected";

    await db.runTransaction(async (tx) => {
      const tSnap = await tx.get(db.collection("tournaments").doc(payment.tournamentId));
      const tournament = tSnap.exists ? tSnap.data()! : { title: "Tournament" };

      tx.update(payRef, {
        status: newStatus,
        reviewedAt: FieldValue.serverTimestamp(),
      });
      tx.update(db.collection("registrations").doc(payment.registrationId), {
        status: newStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.create(db.collection("notifications").doc(), {
        userId: payment.userId,
        title: action === "approve" ? "Payment Approved" : "Payment Rejected",
        message:
          action === "approve"
            ? `Your payment for ${tournament.title} has been approved. Room details will appear in your dashboard soon.`
            : `Your payment for ${tournament.title} was rejected. Please contact support if you believe this is an error.`,
        type: action === "approve" ? "payment_approved" : "payment_rejected",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      if (action === "approve") {
        tx.set(
          db.collection("leaderboard").doc(payment.userId),
          { userId: payment.userId, matchesPlayed: FieldValue.increment(1) },
          { merge: true }
        );
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
