import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// GET /api/admin/withdrawals — list withdrawal requests (admin: all; user: own)
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const db = getAdminDb();
    let snap;
    if (user.role === "admin") {
      snap = await db.collection("withdrawalRequests").limit(200).get();
    } else {
      snap = await db.collection("withdrawalRequests").where("userId", "==", user.uid).limit(50).get();
    }

    let docs = snap.docs;
    if (status) {
      docs = docs.filter((d) => d.data().status === status);
    }

    // Sort by requestedAt desc
    docs.sort((a, b) => {
      const av = a.data().requestedAt;
      const bv = b.data().requestedAt;
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

    const withdrawals = docs.map((doc) => {
      const w = doc.data();
      const u = userMap.get(w.userId) ?? {};
      return {
        id: doc.id,
        userId: w.userId,
        userName: u.name ?? "Unknown",
        userEmail: u.email ?? "",
        userPhoto: u.photoURL ?? null,
        userWalletBalance: typeof u.walletBalance === "number" ? u.walletBalance : 0,
        amount: w.amount,
        upiId: w.upiId,
        note: w.note,
        status: w.status,
        requestedAt: toIso(w.requestedAt),
        processedAt: w.processedAt ? toIso(w.processedAt) : null,
        adminNote: w.adminNote ?? null,
      };
    });

    return NextResponse.json({ ok: true, withdrawals });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// POST /api/admin/withdrawals — admin processes withdrawal
// Body: { withdrawalId, action: "approve" | "reject", adminNote? }
// On approve: deduct from user's wallet + create walletTransaction
// On reject: nothing changes (wallet wasn't deducted at request time)
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { withdrawalId, action, adminNote } = await req.json();
    if (!withdrawalId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    const db = getAdminDb();
    const withdrawalRef = db.collection("withdrawalRequests").doc(withdrawalId);
    const withdrawalSnap = await withdrawalRef.get();
    if (!withdrawalSnap.exists) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const withdrawal = withdrawalSnap.data()!;
    if (withdrawal.status !== "pending") {
      return NextResponse.json({ ok: false, error: "Already processed" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const userRef = db.collection("users").doc(withdrawal.userId);

    await db.runTransaction(async (tx) => {
      // Read user FIRST
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error("User not found");
      const userData = userSnap.data()!;
      const currentBalance = typeof userData.walletBalance === "number" ? userData.walletBalance : 0;

      if (action === "approve") {
        // Double-check user still has enough balance
        if (currentBalance < withdrawal.amount) {
          throw new Error(`User has insufficient balance (₹${currentBalance}) for this withdrawal (₹${withdrawal.amount})`);
        }
        // Deduct from wallet
        tx.update(userRef, {
          walletBalance: currentBalance - withdrawal.amount,
          updatedAt: FieldValue.serverTimestamp(),
        });
        // Create wallet transaction
        tx.create(db.collection("walletTransactions").doc(), {
          userId: withdrawal.userId,
          type: "withdrawal",
          amount: -withdrawal.amount,
          status: "approved",
          note: `Withdrawal to UPI: ${withdrawal.upiId}${adminNote ? ` · ${adminNote}` : ""}`,
          refId: withdrawalId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      tx.update(withdrawalRef, {
        status: newStatus,
        processedAt: FieldValue.serverTimestamp(),
        adminNote: adminNote ?? null,
      });

      // Notify user
      tx.create(db.collection("notifications").doc(), {
        userId: withdrawal.userId,
        title: action === "approve" ? "Withdrawal Approved" : "Withdrawal Rejected",
        message:
          action === "approve"
            ? `Your withdrawal of ₹${withdrawal.amount} to ${withdrawal.upiId} has been approved. Payment will be sent within 24 hours.`
            : `Your withdrawal of ₹${withdrawal.amount} was rejected.${adminNote ? ` Reason: ${adminNote}` : ""}`,
        type: action === "approve" ? "withdrawal_approved" : "withdrawal_rejected",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
