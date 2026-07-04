import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

// GET /api/settings — public endpoint, returns settings safe for client display
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("settings").get();
    const settings: Record<string, string> = {};
    snap.docs.forEach((doc) => {
      const data = doc.data();
      settings[doc.id] = data.value;
    });
    const result = {
      upiId: settings.upiId || "fftournament@upi",
      payeeName: settings.payeeName || "FF Tournament",
      telegramUrl: settings.telegramUrl || "https://t.me/fftournament",
      instagramUrl: settings.instagramUrl || "https://instagram.com/ff.tournament.india",
      supportEmail: settings.supportEmail || "support@fftournament.in",
    };
    return NextResponse.json({ ok: true, settings: result });
  } catch (e) {
    // Fail gracefully with defaults — payment modal should still render
    return NextResponse.json({
      ok: true,
      settings: {
        upiId: "fftournament@upi",
        payeeName: "FF Tournament",
        telegramUrl: "https://t.me/fftournament",
        instagramUrl: "https://instagram.com/ff.tournament.india",
        supportEmail: "support@fftournament.in",
      },
    });
  }
}
