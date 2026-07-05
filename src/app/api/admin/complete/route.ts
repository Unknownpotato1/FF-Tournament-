import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { sendPushNotification } from "@/lib/push";

// POST /api/admin/complete — mark tournament completed + award winners
// Body: { tournamentId, winnerIds: string[], prizeAmount: number }
// - 1v1: winnerIds has 1 user → full prize to that user
// - 2v2: winnerIds has 2 users → prize split equally between them
// - For each winner: credit wallet + create walletTransaction + update leaderboard
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { tournamentId, winnerIds, prizeAmount } = await req.json();
    if (!tournamentId || !Array.isArray(winnerIds) || winnerIds.length === 0 || !prizeAmount) {
      return NextResponse.json({ ok: false, error: "Missing fields (tournamentId, winnerIds[], prizeAmount)" }, { status: 400 });
    }
    if (winnerIds.length > 2) {
      return NextResponse.json({ ok: false, error: "Max 2 winners supported (1v1 = 1, 2v2 = 2)" }, { status: 400 });
    }

    const db = getAdminDb();
    const tRef = db.collection("tournaments").doc(tournamentId);
    const tSnap = await tRef.get();
    if (!tSnap.exists) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const tournament = tSnap.data()!;
    if (tournament.status === "completed") {
      return NextResponse.json({ ok: false, error: "Already completed" }, { status: 400 });
    }

    // Calculate per-winner share (split equally)
    const perWinnerShare = Math.floor(Number(prizeAmount) / winnerIds.length);
    const remainder = Number(prizeAmount) - perWinnerShare * winnerIds.length;
    // Give remainder to first winner (so total adds up exactly)
    const winnerShares = winnerIds.map((id: string, i: number) => ({
      userId: id,
      share: perWinnerShare + (i === 0 ? remainder : 0),
    }));

    await db.runTransaction(async (tx) => {
      // READS FIRST
      // 1. Read registrations (to notify approved players)
      const regSnap = await tx.get(
        db.collection("registrations").where("tournamentId", "==", tournamentId)
      );
      // 2. Read each winner's user doc (for fresh wallet balance)
      const winnerUserSnaps = await Promise.all(
        winnerShares.map((w) => tx.get(db.collection("users").doc(w.userId)))
      );
      const winnerUserData = winnerUserSnaps.map((snap, i) => ({
        ref: db.collection("users").doc(winnerShares[i].userId),
        exists: snap.exists,
        currentBalance: snap.exists ? (typeof snap.data()!.walletBalance === "number" ? snap.data()!.walletBalance : 0) : 0,
        share: winnerShares[i].share,
        userId: winnerShares[i].userId,
      }));

      // WRITES
      // 1. Update tournament status
      tx.update(tRef, {
        status: "completed",
        winnerId: winnerIds[0], // Primary winner (for backward compat)
        winnerIds: winnerIds,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 2. For each winner: credit wallet + create walletTransaction + update leaderboard + create prizeHistory
      for (const wu of winnerUserData) {
        if (!wu.exists) continue; // skip missing users
        tx.update(wu.ref, {
          walletBalance: wu.currentBalance + wu.share,
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.create(db.collection("walletTransactions").doc(), {
          userId: wu.userId,
          type: "tournament_win",
          amount: wu.share,
          status: "approved",
          note: `Prize won: ${tournament.title}${winnerIds.length > 1 ? " (team share)" : ""}`,
          refId: tournamentId,
          createdAt: FieldValue.serverTimestamp(),
        });
        tx.create(db.collection("prizeHistory").doc(), {
          userId: wu.userId,
          tournamentId,
          amount: wu.share,
          createdAt: FieldValue.serverTimestamp(),
        });
        tx.set(
          db.collection("leaderboard").doc(wu.userId),
          {
            userId: wu.userId,
            wins: FieldValue.increment(1),
            prizeEarned: FieldValue.increment(wu.share),
          },
          { merge: true }
        );
      }

      // 3. Notify all approved registrations about tournament completion
      regSnap.forEach((regDoc) => {
        const reg = regDoc.data();
        if (reg.status !== "approved") return;
        const isWinner = winnerIds.includes(reg.userId);
        tx.create(db.collection("notifications").doc(), {
          userId: reg.userId,
          title: isWinner ? "🎉 You Won!" : "Tournament Completed",
          message: isWinner
            ? `Congratulations! You won ₹${winnerShares.find((w) => w.userId === reg.userId)?.share} in ${tournament.title}. Prize added to your wallet.`
            : `${tournament.title} has ended. Better luck next time! Check the leaderboard to see the winner.`,
          type: isWinner ? "tournament_won" : "tournament_completed",
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
    });

    // Send push notifications to winners + all approved players
    for (const w of winnerShares) {
      await sendPushNotification(w.userId, {
        title: "🎉 You Won!",
        body: `Congratulations! You won ₹${w.share} in ${tournament.title}. Prize added to your wallet!`,
        tag: "tournament_win",
        data: { url: "/" },
      });
    }
    // Notify non-winners
    const allRegsSnap = await db.collection("registrations").where("tournamentId", "==", tournamentId).get();
    for (const doc of allRegsSnap.docs) {
      const reg = doc.data();
      if (reg.status !== "approved") continue;
      if (winnerIds.includes(reg.userId)) continue; // skip winners (already notified)
      await sendPushNotification(reg.userId, {
        title: "🎮 Tournament Completed",
        body: `${tournament.title} has ended. Better luck next time!`,
        tag: "tournament_completed",
        data: { url: "/" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
