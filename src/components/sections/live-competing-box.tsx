"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Swords, Flame, TrendingUp } from "lucide-react";

// Generates a fake "live competing" number that fluctuates naturally
function getRandomCount(): number {
  // Base range 1,200 - 2,500 players "competing right now"
  const base = 1200 + Math.floor(Math.random() * 1300);
  return base;
}

export function LiveCompetingBox() {
  const [count, setCount] = useState(() => getRandomCount());
  const [trend, setTrend] = useState<"up" | "down">("up");
  const [delta, setDelta] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const previous = count;
      // Small fluctuation: +/- 1 to 30 players
      const change = Math.floor(Math.random() * 60) - 25; // -25 to +35 (slight upward bias)
      const next = Math.max(1100, Math.min(2800, previous + change));
      setCount(next);
      setDelta(next - previous);
      setTrend(next >= previous ? "up" : "down");
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [count]);

  // Mini sparkline-style bars (decorative, animated)
  const bars = [40, 65, 50, 80, 70, 95, 60, 85, 75, 100];

  return (
    <section className="py-6 sm:py-8 relative">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative glass-card rounded-2xl overflow-hidden border-[#00ff9d]/30"
        >
          {/* Background grid + glows */}
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#00ff9d]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff6b1a]/10 rounded-full blur-3xl" />

          <div className="relative p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-center">
              {/* Live Players Competing */}
              <div className="sm:col-span-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff9d] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ff9d]" />
                  </span>
                  <span className="text-[10px] font-bold text-[#00ff9d] uppercase tracking-[0.2em]">
                    Live Now
                  </span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-[#00ff9d]" />
                  <motion.div
                    key={count}
                    initial={{ scale: 1.1, color: "#00ff9d" }}
                    animate={{ scale: 1, color: "#ffffff" }}
                    transition={{ duration: 0.4 }}
                    className="text-3xl sm:text-4xl font-black text-white tabular-nums"
                  >
                    {count.toLocaleString("en-IN")}
                  </motion.div>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Players competing right now
                </div>
                {delta !== 0 && (
                  <div className={`text-[10px] mt-0.5 flex items-center justify-center sm:justify-start gap-1 ${trend === "up" ? "text-[#00ff9d]" : "text-[#ff6b1a]"}`}>
                    <TrendingUp className={`w-3 h-3 ${trend === "down" ? "rotate-180" : ""}`} />
                    {trend === "up" ? "+" : ""}{delta} in last 30s
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="hidden sm:block col-span-1 h-16 w-px bg-white/10 mx-auto" />

              {/* Live Matches + Sparkline */}
              <div className="sm:col-span-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <Swords className="w-4 h-4 text-[#ff6b1a]" />
                  <span className="text-[10px] font-bold text-[#ff6b1a] uppercase tracking-[0.2em]">
                    Live Matches
                  </span>
                </div>
                <div className="flex items-end justify-center sm:justify-start gap-1 h-12 mt-2">
                  {bars.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: `${h}%` }}
                      animate={{
                        height: [`${h}%`, `${Math.min(100, h + 15)}%`, `${h}%`],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut",
                      }}
                      className="w-1.5 sm:w-2 rounded-t bg-gradient-to-t from-[#00ff9d] to-[#ff6b1a]"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="text-[11px] text-muted-foreground text-center sm:text-left mt-1">
                  {Math.floor(count / 24)} matches in progress
                </div>
              </div>
            </div>

            {/* Bottom strip - mini stats */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center sm:justify-start gap-4 sm:gap-6 text-[11px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Flame className="w-3.5 h-3.5 text-[#ff6b1a]" />
                <span><span className="text-[#00ff9d] font-bold">{Math.floor(count * 0.32).toLocaleString("en-IN")}</span> in Clash Squad</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Swords className="w-3.5 h-3.5 text-[#00ff9d]" />
                <span><span className="text-[#00ff9d] font-bold">{Math.floor(count * 0.18).toLocaleString("en-IN")}</span> in BR Ranked</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5 text-[#ff6b1a]" />
                <span><span className="text-[#00ff9d] font-bold">{Math.floor(count * 0.5).toLocaleString("en-IN")}</span> in Custom Rooms</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
