import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

// GET /api/payments — list payments (admin: all; user: own)
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // pending | approved | rejected

  let where: Record<string, unknown> = {};
  if (user.role === "admin") {
    if (status) where.status = status;
  } else {
    where.userId = user.id;
    if (status) where.status = status;
  }

  const payments = await db.paymentRequest.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, photoURL: true } },
      tournament: { select: { id: true, title: true, type: true, date: true, time: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    payments: payments.map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name,
      userEmail: p.user.email,
      userPhoto: p.user.photoURL,
      tournamentId: p.tournamentId,
      tournamentTitle: p.tournament.title,
      tournamentType: p.tournament.type,
      matchDate: p.tournament.date.toISOString(),
      matchTime: p.tournament.time,
      screenshotURL: p.screenshotURL,
      utrNumber: p.utrNumber,
      amount: p.amount,
      note: p.note,
      status: p.status,
      submittedAt: p.submittedAt.toISOString(),
      reviewedAt: p.reviewedAt?.toISOString() ?? null,
    })),
  });
}

// POST /api/payments/verify — admin verifies a payment
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const { paymentId, action } = await req.json(); // action: "approve" | "reject"
    if (!paymentId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    const payment = await db.paymentRequest.findUnique({
      where: { id: paymentId },
      include: { tournament: true, user: true },
    });
    if (!payment) return NextResponse.json({ ok: false, error: "Payment not found" }, { status: 404 });
    if (payment.status !== "pending") {
      return NextResponse.json({ ok: false, error: "Already reviewed" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    await db.$transaction(async (tx) => {
      await tx.paymentRequest.update({
        where: { id: paymentId },
        data: { status: newStatus, reviewedAt: new Date() },
      });
      await tx.registration.update({
        where: { id: payment.registrationId },
        data: { status: newStatus },
      });

      // Notify user
      await tx.notification.create({
        data: {
          userId: payment.userId,
          title: action === "approve" ? "Payment Approved" : "Payment Rejected",
          message:
            action === "approve"
              ? `Your payment for ${payment.tournament.title} has been approved. Room details will appear in your dashboard soon.`
              : `Your payment for ${payment.tournament.title} was rejected. Please contact support if you believe this is an error.`,
          type: action === "approve" ? "payment_approved" : "payment_rejected",
        },
      });

      // Update leaderboard matchesPlayed only on approval
      if (action === "approve") {
        const lb = await tx.leaderboard.findUnique({ where: { userId: payment.userId } });
        if (lb) {
          await tx.leaderboard.update({
            where: { userId: payment.userId },
            data: { matchesPlayed: { increment: 1 } },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
