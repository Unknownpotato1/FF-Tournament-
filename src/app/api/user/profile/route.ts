import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

// PUT /api/user/profile — update current user's name and/or photoURL
// Body: { name?: string, photoURL?: string }
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });
    }

    const body = await req.json();
    const { name, photoURL } = body;

    // Validate inputs
    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (typeof name === "string" && name.trim().length >= 2 && name.trim().length <= 40) {
      updates.name = name.trim();
    }
    if (typeof photoURL === "string" && (photoURL.startsWith("https://") || photoURL.startsWith("http://"))) {
      updates.photoURL = photoURL;
    }
    // Allow clearing photoURL by sending null
    if (photoURL === null) {
      updates.photoURL = null;
    }

    if (Object.keys(updates).length === 1) {
      // Only updatedAt — no actual changes
      return NextResponse.json({ ok: false, error: "No valid fields to update" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection("users").doc(user.uid).update(updates);

    // Return the updated user object so client can refresh its state
    const updatedUser = {
      ...user,
      name: typeof updates.name === "string" ? updates.name : user.name,
      photoURL: updates.photoURL !== undefined ? (updates.photoURL as string | null) : user.photoURL,
    };

    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
