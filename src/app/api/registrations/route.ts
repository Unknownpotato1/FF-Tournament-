import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

const FIVE_MIN_MS = 5 * 60 * 1000;

// POST /api/registrations — register + submit payment
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });

    const { tournamentId, screenshotURL, utrNumber, note } = await req.json();
    if (!tournamentId || !screenshotURL || !utrNumber) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const db = getAdminDb();
    const tRef = db.collection("tournaments").doc(tournamentId);
    const tSnap = await tRef.get();
    if (!tSnap.exists) return NextResponse.json({ ok: false, error: "Tournament not found" }, { status: 404 });
    const t = tSnap.data()!;
    if (t.status !== "active") return NextResponse.json({ ok: false, error: "Tournament not active" }, { status: 400 });
    if ((t.filledSlots ?? 0) >= (t.slotLimit ?? 0)) return NextResponse.json({ ok: false, error: "Tournament is full" }, { status: 400 });

    // Check for existing registration
    // Use single where + client-side filter to avoid composite index
    const existingSnap = await db
      .collection("registrations")
      .where("tournamentId", "==", tournamentId)
      .limit(100)
      .get();
    const alreadyRegistered = existingSnap.docs.some((d) => d.data().userId === user.uid);
    if (alreadyRegistered) {
      return NextResponse.json({ ok: false, error: "Already registered for this tournament" }, { status: 400 });
    }

    // Create registration + payment in a transaction
    const regId = db.collection("registrations").doc().id;
    const payId = db.collection("paymentRequests").doc().id;

    const willFillTournament = (t.filledSlots ?? 0) + 1 >= (t.slotLimit ?? 0);
    const autoStartAt = willFillTournament ? new Date(Date.now() + FIVE_MIN_MS) : null;
    const autoRoomPublishAt = willFillTournament ? new Date(Date.now() + FIVE_MIN_MS) : null;

    await db.runTransaction(async (tx) => {
      // Re-read tournament to ensure no race condition on slots
      const freshTSnap = await tx.get(tRef);
      if (!freshTSnap.exists) throw new Error("Tournament vanished");
      const freshT = freshTSnap.data()!;
      if ((freshT.filledSlots ?? 0) >= (freshT.slotLimit ?? 0)) throw new Error("Tournament is full");

      tx.set(db.collection("registrations").doc(regId), {
        userId: user.uid,
        tournamentId,
        status: "pending",
        note: note ?? null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.set(db.collection("paymentRequests").doc(payId), {
        userId: user.uid,
        tournamentId,
        registrationId: regId,
        screenshotURL,
        utrNumber,
        amount: t.entryFee,
        note: note ?? null,
        status: "pending",
        submittedAt: FieldValue.serverTimestamp(),
      });

      // Increment filledSlots; if this fills the tournament, set autoStartAt + autoRoomPublishAt
      const updates: Record<string, unknown> = {
        filledSlots: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if ((freshT.filledSlots ?? 0) + 1 >= (freshT.slotLimit ?? 0)) {
        const now = Date.now();
        updates.autoRoomPublishAt = new Date(now + FIVE_MIN_MS);
        updates.autoStartAt = new Date(now + FIVE_MIN_MS);
      }
      tx.update(tRef, updates);

      tx.create(db.collection("notifications").doc(), {
        userId: user.uid,
        title: "Tournament Registered",
        message: `You've registered for ${t.title}. Payment under verification.`,
        type: "tournament_registered",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      // If this fills the tournament, notify admin (visible via admin stats)
      // and notify all approved players that match starts in 5 min
      if ((freshT.filledSlots ?? 0) + 1 >= (freshT.slotLimit ?? 0)) {
        // This is inside transaction — fetch approved registrations
        const approvedSnap = await tx.get(
          db.collection("registrations").where("tournamentId", "==", tournamentId)
        );
        approvedSnap.forEach((regDoc) => {
          const reg = regDoc.data();
          if (reg.status !== "approved") return;
          tx.create(db.collection("notifications").doc(), {
            userId: reg.userId,
            title: "Match Starting Soon",
            message: `${t.title} is full! Match starts in 5 minutes. Room ID & Password will be published in your dashboard shortly.`,
            type: "match_starting",
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });
        });
      }
    });

    return NextResponse.json({
      ok: true,
      registrationId: regId,
      autoStart: willFillTournament ? autoStartAt?.toISOString() : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Helper function (exported) — checks and publishes rooms whose autoRoomPublishAt has passed
// Called lazily by other endpoints (tournaments, dashboard, etc.) to avoid needing cron jobs
export async function processPendingAutoPublish() {
  try {
    const db = getAdminDb();
    const now = new Date();
    // Find tournaments where autoRoomPublishAt has passed but room not yet published
    const snap = await db
      .collection("tournaments")
      .where("status", "==", "active")
      .where("roomPublished", "==", false)
      .get();

    const toPublish: string[] = [];
    snap.forEach((doc) => {
      const t = doc.data();
      if (!t.autoRoomPublishAt) return;
      const publishAt = t.autoRoomPublishAt instanceof Date ? t.autoRoomPublishAt : new Date(t.autoRoomPublishAt._seconds * 1000);
      if (publishAt <= now && t.roomId && t.roomPassword) {
        toPublish.push(doc.id);
      }
    });

    if (toPublish.length === 0) return;

    const batch = db.batch();
    for (const id of toPublish) {
      batch.update(db.collection("tournaments").doc(id), {
        roomPublished: true,
        status: "started",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    // Notify approved registrations
    for (const tournamentId of toPublish) {
      const tSnap = await db.collection("tournaments").doc(tournamentId).get();
      if (!tSnap.exists) continue;
      const tournament = tSnap.data()!;
      const regSnap = await db.collection("registrations").where("tournamentId", "==", tournamentId).get();
      const notifBatch = db.batch();
      regSnap.forEach((regDoc) => {
        const reg = regDoc.data();
        if (reg.status !== "approved") return;
        const notifRef = db.collection("notifications").doc();
        notifBatch.set(notifRef, {
          userId: reg.userId,
          title: "Room Details Published",
          message: `Room ID & Password for ${tournament.title} are now available in your dashboard. Match starting!`,
          type: "room_published",
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
      await notifBatch.commit();
    }
  } catch {
    // Silent fail — auto-publish is best-effort
  }
}
