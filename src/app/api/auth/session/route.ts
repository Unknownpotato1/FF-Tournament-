import { NextResponse } from "next/server";
import { verifyIdTokenAndCreateSession, setSessionCookie } from "@/lib/auth";

// POST /api/auth/session — exchange Firebase ID token for session cookie
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ ok: false, error: "Missing idToken" }, { status: 400 });
    }
    const { token, user } = await verifyIdTokenAndCreateSession(idToken);
    await setSessionCookie(token);
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Auth failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
