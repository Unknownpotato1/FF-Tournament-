"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUI } from "@/stores/ui-store";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  IndianRupee,
  Swords,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Key,
  Loader2,
} from "lucide-react";

type Detail = {
  tournament: {
    id: string;
    type: string;
    title: string;
    entryFee: number;
    prizeAmount: number;
    slotLimit: number;
    filledSlots: number;
    remainingSlots: number;
    date: string;
    time: string;
    status: string;
    rules: string;
    roomPublished: boolean;
  };
  myRegistration: { status: string; roomId: string | null; roomPassword: string | null } | null;
  paymentStatus: string | null;
};

async function fetchDetail(id: string): Promise<Detail> {
  const res = await fetch(`/api/tournaments/detail?id=${id}`, { cache: "no-store" });
  return res.json();
}

export function TournamentDetailsModal() {
  const { activeModal, selectedTournamentId, closeModal, openModal } = useUI();
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);

  const isOpen = activeModal === "tournamentDetails" && !!selectedTournamentId;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tournament", selectedTournamentId],
    queryFn: () => fetchDetail(selectedTournamentId!),
    enabled: isOpen,
  });

  const handleJoin = async () => {
    if (!user) {
      openModal("login");
      return;
    }
    setJoining(true);
    // Small UX delay
    await new Promise((r) => setTimeout(r, 300));
    setJoining(false);
    openModal("payment", selectedTournamentId);
  };

  const t = data?.tournament;
  const myReg = data?.myRegistration;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="sm:max-w-lg bg-[#0c0c12] border-white/10 p-0 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : t ? (
          <>
            {/* Banner */}
            <div className={`relative h-32 bg-gradient-to-br ${t.type === "1v1" ? "from-[#00ff9d]/30 via-[#0a3d2c]/40 to-[#050507]" : "from-[#ff6b1a]/30 via-[#3d1f0a]/40 to-[#050507]"} flex items-center justify-center overflow-hidden`}>
              <div className="absolute inset-0 bg-grid-pattern opacity-30" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#00ff9d]/20 rounded-full blur-3xl" />
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 w-8 h-8 rounded-full glass-card flex items-center justify-center text-white hover:bg-white/10 z-10"
              >
                ✕
              </button>
              <div className="relative text-center">
                <div className="text-5xl mb-1">{t.type === "1v1" ? "⚔️" : "🤝"}</div>
                <div className={`text-xs font-bold tracking-wider uppercase ${t.type === "1v1" ? "text-[#00ff9d]" : "text-[#ff6b1a]"}`}>
                  {t.type === "1v1" ? "1 vs 1 Clash Squad" : "2 vs 2 Clash Squad"}
                </div>
              </div>
            </div>

            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-black text-white">{t.title}</DialogTitle>
              </DialogHeader>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-gradient-to-br from-[#00ff9d]/10 to-transparent border border-[#00ff9d]/20 p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Prize Amount</div>
                  <div className="text-2xl font-black text-[#00ff9d] flex items-center">
                    <IndianRupee className="w-4 h-4" />
                    {t.prizeAmount.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-[#ff6b1a]/10 to-transparent border border-[#ff6b1a]/20 p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Entry Fee</div>
                  <div className="text-2xl font-black text-[#ff6b1a] flex items-center">
                    <IndianRupee className="w-4 h-4" />
                    {t.entryFee.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between p-2.5 rounded-lg glass-card">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-[#00ff9d]" /> Date
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {new Date(t.date).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg glass-card">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 text-[#ff6b1a]" /> Time
                  </span>
                  <span className="text-sm font-semibold text-white">{t.time} IST</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg glass-card">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 text-[#00ff9d]" /> Slots
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {t.filledSlots}/{t.slotLimit} <span className="text-[#00ff9d]">({t.remainingSlots} left)</span>
                  </span>
                </div>
              </div>

              {/* Rules */}
              <div className="glass-card rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#00ff9d]" />
                  <span className="text-sm font-bold text-white">Tournament Rules</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.rules}</p>
              </div>

              {/* Room details (if approved & published) */}
              {myReg?.status === "approved" && t.roomPublished && myReg.roomId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg p-4 mb-4 bg-gradient-to-br from-[#00ff9d]/15 to-transparent border border-[#00ff9d]/40 glow-green"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="w-4 h-4 text-[#00ff9d]" />
                    <span className="text-sm font-bold text-[#00ff9d]">Room Details Published</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Room ID</span>
                      <span className="text-sm font-mono font-bold text-white">{myReg.roomId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Password</span>
                      <span className="text-sm font-mono font-bold text-white">{myReg.roomPassword}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Status / CTA */}
              {myReg ? (
                <div className={`rounded-lg p-4 border ${
                  myReg.status === "approved"
                    ? "bg-[#00ff9d]/10 border-[#00ff9d]/30"
                    : myReg.status === "rejected"
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-yellow-500/10 border-yellow-500/30"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {myReg.status === "approved" ? (
                      <CheckCircle2 className="w-4 h-4 text-[#00ff9d]" />
                    ) : myReg.status === "rejected" ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                    )}
                    <span className={`text-sm font-bold ${
                      myReg.status === "approved" ? "text-[#00ff9d]"
                        : myReg.status === "rejected" ? "text-red-400"
                        : "text-yellow-400"
                    }`}>
                      {myReg.status === "approved"
                        ? "Payment Approved — You're in!"
                        : myReg.status === "rejected"
                        ? "Payment Rejected — Contact Support"
                        : "Payment Under Verification"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {myReg.status === "approved"
                      ? t.roomPublished
                        ? "Room details are visible above. Join the room 5 mins before start."
                        : "Room details will be published 15 mins before match start."
                      : myReg.status === "rejected"
                      ? "Your payment was rejected. Please contact support via Telegram."
                      : "Admin will verify your payment within 15-30 minutes."}
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleJoin}
                  disabled={joining || t.remainingSlots === 0}
                  className="w-full btn-glow-green rounded-xl py-3 text-base"
                >
                  {joining ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Swords className="w-4 h-4 mr-2" />
                  )}
                  {t.remainingSlots === 0 ? "Tournament Full" : `Join for ₹${t.entryFee}`}
                </Button>
              )}

              {!user && !myReg && (
                <p className="text-[11px] text-center text-muted-foreground mt-3">
                  You&apos;ll need to login with Google to join this tournament.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-muted-foreground">Tournament not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
