"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Crown, Medal, Award, Swords, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

type TopPlayer = {
  rank: number;
  userId?: string;
  name: string;
  photoURL: string | null;
  wins: number;
  matchesPlayed: number;
  prizeEarned: number;
};

async function fetchLeaderboard(): Promise<{ topWinners: TopPlayer[] }> {
  const res = await fetch("/api/leaderboard", { cache: "no-store" });
  const data = await res.json();
  return { topWinners: data.topWinners ?? [] };
}

const RANK_STYLES = [
  { bg: "from-yellow-400 to-yellow-600", text: "text-yellow-400", icon: Crown, label: "Champion" },
  { bg: "from-gray-300 to-gray-500", text: "text-gray-300", icon: Medal, label: "Runner-up" },
  { bg: "from-orange-700 to-orange-900", text: "text-orange-600", icon: Award, label: "Third" },
];

export function LeaderboardSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });

  const winners = data?.topWinners ?? [];

  return (
    <section id="leaderboard" className="py-16 sm:py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border border-[#00ff9d]/30 mb-3">
            <Trophy className="w-3.5 h-3.5 text-[#00ff9d]" />
            <span className="text-xs font-bold text-[#00ff9d] tracking-wider uppercase">
              Hall of Fame
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Top <span className="text-[#00ff9d] text-glow-green">Winners</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            The best Free Fire players in India. Compete, win, and climb the ranks.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : winners.length > 0 ? (
          <div className="space-y-2">
            {winners.map((p, i) => {
              const rank = RANK_STYLES[i] ?? null;
              const RankIcon = rank?.icon;
              return (
                <motion.div
                  key={p.userId ?? i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl glass-card ${
                    i < 3 ? "border-[#00ff9d]/30" : ""
                  } group`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-10 text-center">
                    {RankIcon ? (
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${rank!.bg} flex items-center justify-center`}>
                        <RankIcon className="w-5 h-5 text-black" />
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-muted-foreground">#{i + 1}</div>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-10 h-10 border-2 border-white/10">
                    <AvatarImage src={p.photoURL ?? undefined} alt={p.name} />
                    <AvatarFallback className="bg-[#00ff9d]/20 text-[#00ff9d]">
                      {p.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Swords className="w-3 h-3" /> {p.matchesPlayed} matches
                    </div>
                  </div>

                  {/* Wins */}
                  <div className="text-center hidden sm:block">
                    <div className="text-lg font-black text-[#00ff9d]">{p.wins}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Wins</div>
                  </div>

                  {/* Prize */}
                  <div className="text-right">
                    <div className="text-lg font-black text-[#ff6b1a] flex items-center justify-end">
                      <Wallet className="w-3.5 h-3.5 mr-0.5" />
                      ₹{p.prizeEarned.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">Won</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No winners yet. Be the first!</p>
          </div>
        )}
      </div>
    </section>
  );
}
