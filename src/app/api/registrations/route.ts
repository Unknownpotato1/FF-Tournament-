import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

const FIVE_MIN_MS = 5 * 60 * 1000;

// POST /api/registrations — register for tournament (instant wallet deduction)
// Body: { tournamentId, note? }
// Flow:
//   1. Validate user + tournament + slots
//   2. Check wallet has enough balance (entryFee)
//   3. In transaction: deduct entryFee from wallet, create registration (status=approved!),
//      create walletTransaction, increment filledSlots, notify user
//   4. If this fills tournament, set autoStartAt + autoRoomPublishAt + notify approved players
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Login required" }, { status: 401 });

    const { tournamentId, note } = await req.json();
    if (!tournamentId) {
      return NextResponse.json({ ok: false, error: "Missing tournamentId" }, { status: 400 });
    }

    const db = getAdminDb();
    const tRef = db.collection("tournaments").doc(tournamentId);
    const tSnap = await tRef.get();
    if (!tSnap.exists) return NextResponse.json({ ok: false, error: "Tournament not found" }, { status: 404 });
    const t = tSnap.data()!;
    if (t.status !== "active") return NextResponse.json({ ok: false, error: "Tournament not active" }, { status: 400 });
    if ((t.filledSlots ?? 0) >= (t.slotLimit ?? 0)) return NextResponse.json({ ok: false, error: "Tournament is full" }, { status: 400 });

    // Check wallet balance (pre-check; re-check inside transaction for safety)
    const userRef = db.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    const userData = userSnap.data()!;
    const currentBalance = typeof userData.walletBalance === "number" ? userData.walletBalance : 0;
    if (currentBalance < t.entryFee) {
      return NextResponse.json({
        ok: false,
        error: `Insufficient wallet balance. You need ₹${t.entryFee} but have only ₹${currentBalance}. Please recharge your wallet.`,
        insufficientBalance: true,
        required: t.entryFee,
        current: currentBalance,
      }, { status: 400 });
    }

    // Check for existing registration (single where + client filter)
    const existingSnap = await db
      .collection("registrations")
      .where("tournamentId", "==", tournamentId)
      .limit(100)
      .get();
    const alreadyRegistered = existingSnap.docs.some((d) => d.data().userId === user.uid);
    if (alreadyRegistered) {
      return NextResponse.json({ ok: false, error: "Already registered for this tournament" }, { status: 400 });
    }

    // Create registration + deduct wallet + create walletTransaction in a transaction
    const regId = db.collection("registrations").doc().id;
    const txnId = db.collection("walletTransactions").doc().id;

    await db.runTransaction(async (tx) => {
      // READS FIRST (Firestore requires reads before writes)
      // 1. Re-read tournament (race condition protection)
      const freshTSnap = await tx.get(tRef);
      if (!freshTSnap.exists) throw new Error("Tournament vanished");
      const freshT = freshTSnap.data()!;
      if ((freshT.filledSlots ?? 0) >= (freshT.slotLimit ?? 0)) throw new Error("Tournament is full");

      // 2. Re-read user (for fresh wallet balance)
      const freshUserSnap = await tx.get(userRef);
      if (!freshUserSnap.exists) throw new Error("User not found");
      const freshUserData = freshUserSnap.data()!;
      const freshBalance = typeof freshUserData.walletBalance === "number" ? freshUserData.walletBalance : 0;
      if (freshBalance < t.entryFee) {
        throw new Error(`Insufficient balance (₹${freshBalance}). Recharge your wallet first.`);
      }

      // 3. If this registration will fill the tournament, read existing approved registrations
      //    (so we can notify them about match starting soon)
      const willFill = (freshT.filledSlots ?? 0) + 1 >= (freshT.slotLimit ?? 0);
      let approvedRegs: { userId: string }[] = [];
      if (willFill) {
        const approvedSnap = await tx.get(
          db.collection("registrations").where("tournamentId", "==", tournamentId)
        );
        approvedRegs = approvedSnap.docs
          .map((d) => d.data())
          .filter((reg) => reg.status === "approved")
          .map((reg) => ({ userId: reg.userId as string }));
      }

      // WRITES (all reads done above)
      // 1. Deduct entryFee from user's wallet
      tx.update(userRef, {
        walletBalance: freshBalance - t.entryFee,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 2. Create registration (status = "approved" since wallet was charged instantly)
      tx.set(db.collection("registrations").doc(regId), {
        userId: user.uid,
        tournamentId,
        status: "approved", // Wallet-charged = auto-approved
        note: note ?? null,
        entryFeePaid: t.entryFee,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 3. Create wallet transaction (debit)
      tx.set(db.collection("walletTransactions").doc(txnId), {
        userId: user.uid,
        type: "tournament_join",
        amount: -t.entryFee,
        status: "approved",
        note: `Tournament entry: ${t.title}`,
        refId: tournamentId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 4. Increment tournament filledSlots + set autoStart if filling
      const updates: Record<string, unknown> = {
        filledSlots: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (willFill) {
        const now = Date.now();
        updates.autoRoomPublishAt = new Date(now + FIVE_MIN_MS);
        updates.autoStartAt = new Date(now + FIVE_MIN_MS);
      }
      tx.update(tRef, updates);

      // 5. Notify user about successful registration
      tx.create(db.collection("notifications").doc(), {
        userId: user.uid,
        title: "Tournament Joined Successfully",
        message: `You've joined ${t.title}. ₹${t.entryFee} deducted from your wallet. Match starts when all slots fill.`,
        type: "tournament_registered",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 6. If this fills tournament, notify all approved players
      if (willFill) {
        for (const reg of approvedRegs) {
          tx.create(db.collection("notifications").doc(), {
            userId: reg.userId,
            title: "Match Starting Soon",
            message: `${t.title} is full! Match starts in 5 minutes. Room ID & Password will be published in your dashboard shortly.`,
            type: "match_starting",
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }
    });

    return NextResponse.json({
      ok: true,
      registrationId: regId,
      newWalletBalance: currentBalance - t.entryFee,
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
      if (publishAt <= now) {
        toPublish.push(doc.id);
      }
    });

    if (toPublish.length === 0) return;

    const batch = db.batch();
    const tournamentDocs = new Map<string, any>();
    for (const id of toPublish) {
      const tSnap = await db.collection("tournaments").doc(id).get();
      if (!tSnap.exists) continue;
      const tData = tSnap.data()!;
      tournamentDocs.set(id, tData);
      const updates: Record<string, unknown> = {
        status: "started",
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (tData.roomId && tData.roomPassword) {
        updates.roomPublished = true;
      }
      batch.update(db.collection("tournaments").doc(id), updates);
    }
    await batch.commit();

    for (const tournamentId of toPublish) {
      const tournament = tournamentDocs.get(tournamentId);
      if (!tournament) continue;
      const hasRoom = !!(tournament.roomId && tournament.roomPassword);
      const regSnap = await db.collection("registrations").where("tournamentId", "==", tournamentId).get();
      const notifBatch = db.batch();
      regSnap.forEach((regDoc) => {
        const reg = regDoc.data();
        if (reg.status !== "approved") return;
        const notifRef = db.collection("notifications").doc();
        notifBatch.set(notifRef, {
          userId: reg.userId,
          title: hasRoom ? "Room Details Published" : "Match Started",
          message: hasRoom
            ? `Room ID & Password for ${tournament.title} are now available in your dashboard. Match starting!`
            : `${tournament.title} has started! Room details will appear in your dashboard once admin publishes them.`,
          type: hasRoom ? "room_published" : "match_starting",
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
