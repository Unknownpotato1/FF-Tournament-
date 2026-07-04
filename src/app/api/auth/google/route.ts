import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, setSessionCookie, getCurrentUser } from "@/lib/auth";

// Simulates Firebase Google Login
export async function POST() {
  try {
    // In production this would verify a Firebase ID token.
    // For the demo we create / sign-in a demo Google user.
    const demoEmail = "player.google@fftournament.in";
    const demoName = "Free Fire Player";
    const demoUid = "google_demo_uid_" + Buffer.from(demoEmail).toString("hex").slice(0, 16);
    const photoURL = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(demoEmail)}`;

    let user = await db.user.findUnique({ where: { email: demoEmail } });
    if (!user) {
      user = await db.user.create({
        data: {
          uid: demoUid,
          name: demoName,
          email: demoEmail,
          photoURL,
          role: "user",
        },
      });
      await db.leaderboard.create({ data: { userId: user.id } });
    }

    const token = createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        registeredAt: user.registeredAt.toISOString(),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, user: null });
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      role: user.role,
      registeredAt: user.registeredAt.toISOString(),
    },
  });
}
