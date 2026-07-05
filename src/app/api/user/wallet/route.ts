import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";

// GET /api/user/wallet — get current user's wallet balance + recent transactions
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const db = getAdminDb();
    // Fetch wallet transactions for this user (single where — no composite index needed)
    const [creditSnap, debitSnap, rechargeSnap, withdrawalSnap] = await Promise.all([
      db.collection("walletTransactions").where("userId", "==", user.uid).limit(100).get(),
      db.collection("rechargeRequests").where("userId", "==", user.uid).limit(20).get(),
      db.collection("withdrawalRequests").where("userId", "==", user.uid).limit(20).get(),
      Promise.resolve(null), // placeholder
    ]);

    // Combine and sort transactions
    type Txn = {
      id: string;
      type: string; // "recharge" | "tournament_join" | "tournament_win" | "withdrawal" | "refund" | "admin_adjust"
      amount: number; // positive = credit, negative = debit
      status: string; // "pending" | "approved" | "rejected"
      note: string;
      createdAt: string;
      ms: number;
    };

    const txns: Txn[] = [];

    // Wallet transactions (tournament joins, winnings, refunds, admin adjustments)
    creditSnap.docs.forEach((doc) => {
      const t = doc.data();
      const createdAt = t.createdAt instanceof Date
        ? t.createdAt.toISOString()
        : t.createdAt?._seconds
        ? new Date(t.createdAt._seconds * 1000).toISOString()
        : new Date().toISOString();
      txns.push({
        id: doc.id,
        type: t.type,
        amount: t.amount,
        status: t.status || "approved",
        note: t.note || "",
        createdAt,
        ms: new Date(createdAt).getTime(),
      });
    });

    // Recharge requests
    rechargeSnap.docs.forEach((doc) => {
      const r = doc.data();
      const createdAt = r.submittedAt instanceof Date
        ? r.submittedAt.toISOString()
        : r.submittedAt?._seconds
        ? new Date(r.submittedAt._seconds * 1000).toISOString()
        : new Date().toISOString();
      txns.push({
        id: doc.id,
        type: "recharge",
        amount: r.amount,
        status: r.status,
        note: `Recharge via UPI · UTR: ${r.utrNumber}`,
        createdAt,
        ms: new Date(createdAt).getTime(),
      });
    });

    // Withdrawal requests
    withdrawalSnap.docs.forEach((doc) => {
      const w = doc.data();
      const createdAt = w.requestedAt instanceof Date
        ? w.requestedAt.toISOString()
        : w.requestedAt?._seconds
        ? new Date(w.requestedAt._seconds * 1000).toISOString()
        : new Date().toISOString();
      txns.push({
        id: doc.id,
        type: "withdrawal",
        amount: -w.amount, // withdrawals are debits
        status: w.status,
        note: `Withdrawal to UPI: ${w.upiId || "N/A"}`,
        createdAt,
        ms: new Date(createdAt).getTime(),
      });
    });

    // Sort newest first
    txns.sort((a, b) => b.ms - a.ms);

    return NextResponse.json({
      ok: true,
      wallet: {
        balance: user.walletBalance ?? 0,
        transactions: txns.slice(0, 50),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
