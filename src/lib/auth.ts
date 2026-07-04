import { cookies } from "next/headers";
import crypto from "crypto";
import { getAdminAuth } from "@/lib/firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";

export const SESSION_COOKIE = "ff_session";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

const SESSION_SECRET =
  process.env.SESSION_SECRET || "ff-tournament-dev-secret-change-in-production-32+chars";

// ---------- HMAC session token helpers ----------
function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

function verify(token: string): { uid: string } | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  if (sig !== expected) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    if (typeof decoded.expires !== "number" || Date.now() > decoded.expires) return null;
    return { uid: decoded.uid as string };
  } catch {
    return null;
  }
}

export async function createSession(uid: string): Promise<string> {
  const expires = Date.now() + SESSION_TTL * 1000;
  const payload = Buffer.from(JSON.stringify({ uid, expires })).toString("base64");
  return sign(payload);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_TTL,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// ---------- Firebase ID token verification + user lookup ----------
export async function verifyIdTokenAndCreateSession(
  idToken: string
): Promise<{ token: string; user: UserRecord }> {
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  const uid = decoded.uid;

  // Get or create user doc in Firestore
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  let user: UserRecord;

  if (!userSnap.exists) {
    // Create new user doc
    user = {
      uid,
      name: decoded.name || decoded.email?.split("@")[0] || "Player",
      email: decoded.email || "",
      photoURL: decoded.picture || null,
      role: decoded.email?.endsWith("@admin.in") ? "admin" : "user",
      registeredAt: new Date().toISOString(),
    };
    await userRef.set({
      ...user,
      registeredAt: new Date(), // Firestore Timestamp
    });
    // Create leaderboard entry
    await db.collection("leaderboard").doc(uid).set({
      userId: uid,
      matchesPlayed: 0,
      wins: 0,
      prizeEarned: 0,
    });
  } else {
    const data = userSnap.data()!;
    user = {
      uid,
      name: data.name || "Player",
      email: data.email || "",
      photoURL: data.photoURL || null,
      role: data.role || "user",
      registeredAt:
        data.registeredAt instanceof Date
          ? data.registeredAt.toISOString()
          : new Date(data.registeredAt?._seconds * 1000 || Date.now()).toISOString(),
    };
  }

  const token = await createSession(uid);
  return { token, user };
}

// ---------- Current user helpers ----------
export async function getCurrentUser(): Promise<UserRecord | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = verify(token);
  if (!session) return null;

  try {
    const db = getAdminDb();
    const userSnap = await db.collection("users").doc(session.uid).get();
    if (!userSnap.exists) return null;
    const data = userSnap.data()!;
    return {
      uid: session.uid,
      name: data.name || "Player",
      email: data.email || "",
      photoURL: data.photoURL || null,
      role: data.role || "user",
      registeredAt:
        data.registeredAt instanceof Date
          ? data.registeredAt.toISOString()
          : data.registeredAt?._seconds
          ? new Date(data.registeredAt._seconds * 1000).toISOString()
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
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

export type UserRecord = {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: "user" | "admin";
  registeredAt: string;
};
