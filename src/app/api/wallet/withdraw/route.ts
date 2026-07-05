import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

const MIN_WITHDRAWAL = 50;

// POST /api/wallet/withdraw — user requests withdrawal
// Body: { amount, upiId, note? }
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });

    const { amount, upiId, note } = await req.json();
    if (!amount || typeof amount !== "number" || amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ ok: false, error: `Minimum withdrawal: ₹${MIN_WITHDRAWAL}` }, { status: 400 });
    }
    if (!upiId || typeof upiId !== "string" || !upiId.includes("@")) {
      return NextResponse.json({ ok: false, error: "Valid UPI ID required (e.g. yourname@upi)" }, { status: 400 });
    }

    const currentBalance = user.walletBalance ?? 0;
    if (amount > currentBalance) {
      return NextResponse.json({
        ok: false,
        error: `Insufficient balance. Your wallet has ₹${currentBalance}.`,
      }, { status: 400 });
    }

    const db = getAdminDb();
    // Create withdrawal request — amount is held (not yet deducted from wallet)
    // Admin will deduct when approving the withdrawal
    const ref = await db.collection("withdrawalRequests").add({
      userId: user.uid,
      amount: Number(amount),
      upiId: upiId.trim(),
      note: note ?? null,
      status: "pending",
      requestedAt: FieldValue.serverTimestamp(),
    });

    // Notify user
    await db.collection("notifications").doc().set({
      userId: user.uid,
      title: "Withdrawal Requested",
      message: `Your withdrawal of ₹${amount} to UPI ${upiId} is pending admin approval.`,
      type: "withdrawal_requested",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, withdrawalId: ref.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
