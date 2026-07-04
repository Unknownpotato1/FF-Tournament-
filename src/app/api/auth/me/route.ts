import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

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
