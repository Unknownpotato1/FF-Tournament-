import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// POST /api/admin/wallet/adjust — admin manually adjusts user's wallet balance
// Body: { userId, amount, note, action: "add" | "subtract" }
// amount is always positive; action determines direction
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { userId, amount, note, action } = await req.json();
    if (!userId || !amount || !["add", "subtract"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Amount must be positive" }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(userId);
    const delta = action === "add" ? amount : -amount;

    await db.runTransaction(async (tx) => {
      // Read user FIRST
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error("User not found");
      const userData = userSnap.data()!;
      const currentBalance = typeof userData.walletBalance === "number" ? userData.walletBalance : 0;
      const newBalance = currentBalance + delta;
      if (newBalance < 0) {
        throw new Error(`Cannot subtract ₹${amount} — user only has ₹${currentBalance}`);
      }

      tx.update(userRef, {
        walletBalance: newBalance,
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.create(db.collection("walletTransactions").doc(), {
        userId,
        type: "admin_adjust",
        amount: delta,
        status: "approved",
        note: `Admin ${action === "add" ? "credited" : "debited"} ₹${amount}${note ? ` · ${note}` : ""}`,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Notify user
      tx.create(db.collection("notifications").doc(), {
        userId,
        title: action === "add" ? "Wallet Credited" : "Wallet Debited",
        message: `Admin ${action === "add" ? "added" : "deducted"} ₹${amount} ${action === "add" ? "to" : "from"} your wallet. New balance: ₹${newBalance}.${note ? ` Reason: ${note}` : ""}`,
        type: "wallet_adjusted",
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
