import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/settings — get all app settings
export async function GET() {
  try {
    await requireAdmin();
    const db = getAdminDb();
    const snap = await db.collection("settings").get();
    const settings: Record<string, string> = {};
    snap.docs.forEach((doc) => {
      const data = doc.data();
      settings[doc.id] = data.value;
    });
    // Defaults
    const result = {
      upiId: settings.upiId || "fftournament@upi",
      payeeName: settings.payeeName || "FF Tournament",
      telegramUrl: settings.telegramUrl || "https://t.me/fftournament",
      instagramUrl: settings.instagramUrl || "https://instagram.com/ff.tournament.india",
      supportEmail: settings.supportEmail || "support@fftournament.in",
    };
    return NextResponse.json({ ok: true, settings: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// PUT /api/admin/settings — update settings (sends full settings object)
export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const db = getAdminDb();
    const batch = db.batch();
    for (const [key, value] of Object.entries(body)) {
      if (typeof value !== "string") continue;
      const ref = db.collection("settings").doc(key);
      batch.set(ref, { value, updatedAt: new Date() }, { merge: true });
    }
    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
