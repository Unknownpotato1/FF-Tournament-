"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, motion } from "framer-motion";
import { Users, Swords, Trophy, Wallet } from "lucide-react";

type Stat = {
  key: string;
  label: string;
  icon: typeof Users;
  value: number;
  prefix?: string;
  suffix?: string;
  format?: "indian" | "default";
};

function useCountUp(target: number, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return val;
}

function formatIndian(n: number) {
  return n.toLocaleString("en-IN");
}

function StatItem({ stat, inView, delay }: { stat: Stat; inView: boolean; delay: number }) {
  const value = useCountUp(stat.value, 2000, inView);
  const display =
    stat.format === "indian" ? formatIndian(value) : value.toLocaleString("en-US");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="glass-card glass-card-hover rounded-xl p-5 sm:p-6 text-center group"
    >
      <div className="inline-flex w-12 h-12 sm:w-14 sm:h-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#00ff9d]/20 to-[#ff6b1a]/10 border border-[#00ff9d]/30 mb-3 sm:mb-4 group-hover:glow-green transition-all">
        <stat.icon className="w-6 h-6 text-[#00ff9d]" />
      </div>
      <div className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tight">
        {stat.prefix}
        {display}
        {stat.suffix}
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">
        {stat.label}
      </div>
    </motion.div>
  );
}

export function StatsSection({ stats }: { stats: { registeredPlayers: number; matchesPlayed: number; winners: number; prizePool: number } }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const items: Stat[] = [
    { key: "players", label: "Registered Players", icon: Users, value: stats.registeredPlayers, format: "indian" },
    { key: "matches", label: "Matches Played", icon: Swords, value: stats.matchesPlayed, format: "indian" },
    { key: "winners", label: "Winners", icon: Trophy, value: stats.winners, format: "indian" },
    { key: "prize", label: "Prize Pool Distributed", icon: Wallet, value: stats.prizePool, prefix: "₹", format: "indian" },
  ];

  return (
    <section className="py-16 sm:py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Trusted by <span className="text-[#00ff9d] text-glow-green">Thousands</span> of Players
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Real numbers from real tournaments. Join the biggest Free Fire esports community in India.
          </p>
        </div>
        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {items.map((stat, i) => (
            <StatItem key={stat.key} stat={stat} inView={inView} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
