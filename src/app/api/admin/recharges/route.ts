import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { sendPushNotification } from "@/lib/push";

// GET /api/admin/recharges — list recharge requests (admin: all; user: own)
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const db = getAdminDb();
    let snap;
    if (user.role === "admin") {
      snap = await db.collection("rechargeRequests").limit(200).get();
    } else {
      snap = await db.collection("rechargeRequests").where("userId", "==", user.uid).limit(50).get();
    }

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

    // Hydrate user info
    const userIds = [...new Set(docs.map((d) => d.data().userId))];
    const userSnaps = await Promise.all(userIds.map((id) => db.collection("users").doc(id).get()));
    const userMap = new Map(userSnaps.filter((s) => s.exists).map((s) => [s.id, s.data()!]));

    const toIso = (v: unknown): string => {
      if (v instanceof Date) return v.toISOString();
      if (v && typeof v === "object" && "_seconds" in v) return new Date((v as { _seconds: number })._seconds * 1000).toISOString();
      return new Date().toISOString();
    };

    const recharges = docs.map((doc) => {
      const r = doc.data();
      const u = userMap.get(r.userId) ?? {};
      return {
        id: doc.id,
        userId: r.userId,
        userName: u.name ?? "Unknown",
        userEmail: u.email ?? "",
        userPhoto: u.photoURL ?? null,
        userWalletBalance: typeof u.walletBalance === "number" ? u.walletBalance : 0,
        amount: r.amount,
        screenshotURL: r.screenshotURL,
        utrNumber: r.utrNumber,
        note: r.note,
        status: r.status,
        submittedAt: toIso(r.submittedAt),
        reviewedAt: r.reviewedAt ? toIso(r.reviewedAt) : null,
      };
    });

    return NextResponse.json({ ok: true, recharges });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// POST /api/admin/recharges — admin approves/rejects a recharge
// Body: { rechargeId, action: "approve" | "reject" }
// On approve: credit user's wallet + create walletTransaction
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { rechargeId, action } = await req.json();
    if (!rechargeId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    const db = getAdminDb();
    const rechargeRef = db.collection("rechargeRequests").doc(rechargeId);
    const rechargeSnap = await rechargeRef.get();
    if (!rechargeSnap.exists) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const recharge = rechargeSnap.data()!;
    if (recharge.status !== "pending") {
      return NextResponse.json({ ok: false, error: "Already reviewed" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Read user FIRST (must happen before any writes in transaction)
    const userRef = db.collection("users").doc(recharge.userId);

    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error("User not found");
      const userData = userSnap.data()!;
      const currentBalance = typeof userData.walletBalance === "number" ? userData.walletBalance : 0;

      // Update recharge status
      tx.update(rechargeRef, {
        status: newStatus,
        reviewedAt: FieldValue.serverTimestamp(),
      });

      if (action === "approve") {
        // Credit user's wallet
        tx.update(userRef, {
          walletBalance: currentBalance + recharge.amount,
          updatedAt: FieldValue.serverTimestamp(),
        });
        // Create wallet transaction record
        tx.create(db.collection("walletTransactions").doc(), {
          userId: recharge.userId,
          type: "recharge",
          amount: recharge.amount,
          status: "approved",
          note: `Recharge approved · UTR: ${recharge.utrNumber}`,
          refId: rechargeId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // Notify user
      tx.create(db.collection("notifications").doc(), {
        userId: recharge.userId,
        title: action === "approve" ? "Recharge Approved" : "Recharge Rejected",
        message:
          action === "approve"
            ? `Your recharge of ₹${recharge.amount} has been approved. New wallet balance: ₹${currentBalance + recharge.amount}.`
            : `Your recharge of ₹${recharge.amount} was rejected. Please contact support.`,
        type: action === "approve" ? "recharge_approved" : "recharge_rejected",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    // Send push notification to user
    await sendPushNotification(recharge.userId, {
      title: action === "approve" ? "✅ Recharge Approved!" : "❌ Recharge Rejected",
      body:
        action === "approve"
          ? `Your recharge of ₹${recharge.amount} has been approved. Wallet credited!`
          : `Your recharge of ₹${recharge.amount} was rejected. Contact support.`,
      tag: "recharge",
      data: { url: "/" },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
