import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// POST /api/wallet/recharge — user submits wallet recharge request
// Body: { amount, screenshotURL, utrNumber, note? }
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });

    const { amount, screenshotURL, utrNumber, note } = await req.json();
    if (!amount || typeof amount !== "number" || amount < 10) {
      return NextResponse.json({ ok: false, error: "Minimum recharge: ₹10" }, { status: 400 });
    }
    if (amount > 100000) {
      return NextResponse.json({ ok: false, error: "Maximum recharge: ₹1,00,000" }, { status: 400 });
    }
    if (!screenshotURL || !utrNumber) {
      return NextResponse.json({ ok: false, error: "Screenshot + UTR required" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = await db.collection("rechargeRequests").add({
      userId: user.uid,
      amount: Number(amount),
      screenshotURL,
      utrNumber,
      note: note ?? null,
      status: "pending",
      submittedAt: FieldValue.serverTimestamp(),
    });

    // Notify user
    await db.collection("notifications").doc().set({
      userId: user.uid,
      title: "Recharge Submitted",
      message: `Your recharge of ₹${amount} is under verification. You'll be notified once approved.`,
      type: "recharge_submitted",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, rechargeId: ref.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
