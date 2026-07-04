"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users, Clock, Calendar, IndianRupee, Zap, Swords } from "lucide-react";
import { useUI } from "@/stores/ui-store";
import { Skeleton } from "@/components/ui/skeleton";

type Tournament = {
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
};

async function fetchTournaments(): Promise<Tournament[]> {
  const res = await fetch("/api/tournaments", { cache: "no-store" });
  const data = await res.json();
  return data.tournaments ?? [];
}

function TournamentCardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-5 space-y-3">
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-10 w-full rounded-full" />
    </div>
  );
}

function TournamentCard({ t, index }: { t: Tournament; index: number }) {
  const { openModal } = useUI();
  const date = new Date(t.date);
  const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fillPercent = Math.min(100, Math.round((t.filledSlots / t.slotLimit) * 100));
  const isAlmostFull = t.remainingSlots <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="glass-card glass-card-hover rounded-xl p-5 flex flex-col h-full group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
              t.type === "1v1"
                ? "bg-[#00ff9d]/15 text-[#00ff9d] border border-[#00ff9d]/30"
                : "bg-[#ff6b1a]/15 text-[#ff6b1a] border border-[#ff6b1a]/30"
            }`}
          >
            {t.type === "1v1" ? "1v1 CLASH" : "2v2 CLASH"}
          </div>
          <span className="status-badge status-active">● Active</span>
        </div>
        {isAlmostFull && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold border border-red-500/30">
            <Zap className="w-3 h-3" /> Filling Fast
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{t.title}</h3>
      <p className="text-xs text-muted-foreground mb-4 line-clamp-1">{t.rules}</p>

      {/* Prize & Fee */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg bg-gradient-to-br from-[#00ff9d]/10 to-transparent border border-[#00ff9d]/20 p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Prize</div>
          <div className="text-xl font-black text-[#00ff9d] flex items-center">
            <IndianRupee className="w-4 h-4" />
            {t.prizeAmount.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-[#ff6b1a]/10 to-transparent border border-[#ff6b1a]/20 p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Entry Fee</div>
          <div className="text-xl font-black text-[#ff6b1a] flex items-center">
            <IndianRupee className="w-4 h-4" />
            {t.entryFee.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Slots */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-3.5 h-3.5" /> {t.filledSlots}/{t.slotLimit} slots
          </span>
          <span className="text-[#00ff9d] font-semibold">{t.remainingSlots} left</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${fillPercent}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="h-full rounded-full bg-gradient-to-r from-[#00ff9d] to-[#ff6b1a]"
          />
        </div>
      </div>

      {/* Date & Time */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-[#00ff9d]" /> {dateStr}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-[#ff6b1a]" /> {t.time}
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={() => openModal("tournamentDetails", t.id)}
        className="btn-glow-green rounded-full py-2.5 text-sm font-bold w-full mt-auto flex items-center justify-center gap-2"
      >
        <Swords className="w-4 h-4" /> Join Now
      </button>
    </motion.div>
  );
}

export function TournamentsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: fetchTournaments,
  });

  return (
    <section id="tournaments" className="py-16 sm:py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border border-[#ff6b1a]/30 mb-3">
            <Trophy className="w-3.5 h-3.5 text-[#ff6b1a]" />
            <span className="text-xs font-bold text-[#ff6b1a] tracking-wider uppercase">
              Live Tournaments
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Active <span className="text-[#00ff9d] text-glow-green">Tournaments</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Browse available 1v1 and 2v2 Clash Squad tournaments. Pay entry fee, get verified, and play for cash prizes.
          </p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <TournamentCardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((t, i) => (
              <TournamentCard key={t.id} t={t} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-card rounded-2xl">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No active tournaments right now. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
