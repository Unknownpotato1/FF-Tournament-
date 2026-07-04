import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";
import crypto from "crypto";

// Email + name login (demo). In production this is replaced by Firebase Google Sign-In.
export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    if (!email || !name) {
      return NextResponse.json({ ok: false, error: "Email and name are required" }, { status: 400 });
    }
    const uid = "email_" + crypto.createHash("sha1").update(email).digest("hex").slice(0, 16);
    const photoURL = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;

    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: { uid, name, email, photoURL, role: email.endsWith("@admin.in") ? "admin" : "user" },
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
