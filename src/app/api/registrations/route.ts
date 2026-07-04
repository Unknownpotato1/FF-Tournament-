import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/registrations — register for a tournament (creates pending registration + payment request)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });

    const { tournamentId, screenshotURL, utrNumber, note } = await req.json();
    if (!tournamentId || !screenshotURL || !utrNumber) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return NextResponse.json({ ok: false, error: "Tournament not found" }, { status: 404 });
    if (tournament.status !== "active") {
      return NextResponse.json({ ok: false, error: "Tournament not active" }, { status: 400 });
    }
    if (tournament.filledSlots >= tournament.slotLimit) {
      return NextResponse.json({ ok: false, error: "Tournament is full" }, { status: 400 });
    }

    // Check for existing registration
    const existing = await db.registration.findFirst({
      where: { tournamentId, userId: user.id },
    });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Already registered for this tournament" }, { status: 400 });
    }

    // Create registration + payment request in a transaction
    const registration = await db.$transaction(async (tx) => {
      const reg = await tx.registration.create({
        data: { userId: user.id, tournamentId, status: "pending", note },
      });
      await tx.paymentRequest.create({
        data: {
          userId: user.id,
          tournamentId,
          registrationId: reg.id,
          screenshotURL,
          utrNumber,
          amount: tournament.entryFee,
          note,
          status: "pending",
        },
      });
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { filledSlots: { increment: 1 } },
      });
      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Tournament Registered",
          message: `You've registered for ${tournament.title}. Payment under verification.`,
          type: "tournament_registered",
        },
      });
      return reg;
    });

    return NextResponse.json({ ok: true, registrationId: registration.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
