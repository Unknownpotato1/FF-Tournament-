import { db } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

export const SESSION_COOKIE = "ff_session";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

// In production, set SESSION_SECRET env var to a long random string.
const SESSION_SECRET = process.env.SESSION_SECRET || "ff-tournament-dev-secret-change-in-production-32+chars";

function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

function verify(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  if (sig !== expected) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    if (typeof decoded.expires !== "number" || Date.now() > decoded.expires) return null;
    return decoded.userId as string;
  } catch {
    return null;
  }
}

export function createSession(userId: string): string {
  const expires = Date.now() + SESSION_TTL * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, expires })).toString("base64");
  return sign(payload);
}

export async function getSession(): Promise<{ userId: string } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = verify(token);
  if (!userId) return null;
  return { userId };
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_TTL,
    path: "/",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
