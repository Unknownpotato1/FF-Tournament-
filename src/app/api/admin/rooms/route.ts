import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/rooms — publish room details for a tournament
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { tournamentId, roomId, roomPassword } = await req.json();
    if (!tournamentId || !roomId || !roomPassword) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }
    await db.tournament.update({
      where: { id: tournamentId },
      data: { roomId, roomPassword, roomPublished: true },
    });

    // Notify all approved registrations
    const approvedRegs = await db.registration.findMany({
      where: { tournamentId, status: "approved" },
    });
    const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
    if (tournament) {
      await db.notification.createMany({
        data: approvedRegs.map((r) => ({
          userId: r.userId,
          title: "Room Details Published",
          message: `Room ID & Password for ${tournament.title} are now available in your dashboard.`,
          type: "room_published",
        })),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
