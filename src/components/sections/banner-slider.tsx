"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";

type Banner = {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  bgGradient: string;
  emoji: string;
  tag: string;
};

const BANNERS: Banner[] = [
  {
    id: 1,
    title: "Weekend Championship",
    subtitle: "₹10,000 Prize Pool · 2v2 Clash Squad",
    cta: "Register Now",
    bgGradient: "from-[#00ff9d]/30 via-[#0a3d2c]/40 to-[#050507]",
    emoji: "🏆",
    tag: "BIGGEST EVENT",
  },
  {
    id: 2,
    title: "Daily Solo Showdown",
    subtitle: "1v1 Clash Squad · Entry ₹20 · Win ₹100",
    cta: "Join Battle",
    bgGradient: "from-[#ff6b1a]/30 via-[#3d1f0a]/40 to-[#050507]",
    emoji: "🔥",
    tag: "DAILY TOURNAMENT",
  },
  {
    id: 3,
    title: "Pro Players League",
    subtitle: "Top 16 teams · Single Elimination · ₹15,000 Prize",
    cta: "Watch Live",
    bgGradient: "from-purple-500/20 via-[#1a0a3d]/40 to-[#050507]",
    emoji: "🎮",
    tag: "PREMIER LEAGUE",
  },
  {
    id: 4,
    title: "Newcomer Special",
    subtitle: "First tournament free · Win your share of ₹2,000",
    cta: "Claim Free Entry",
    bgGradient: "from-[#00d4ff]/20 via-[#0a2a3d]/40 to-[#050507]",
    emoji: "⭐",
    tag: "BEGINNER FRIENDLY",
  },
];

export function BannerSlider() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const go = useCallback((next: number, dir: number) => {
    setIndex((next + BANNERS.length) % BANNERS.length);
    setDirection(dir);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const banner = BANNERS[index];

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="relative h-[280px] sm:h-[360px] md:h-[420px] rounded-2xl overflow-hidden glass-card">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={banner.id}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 80 : -80, scale: 1.05 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction > 0 ? -80 : 80, scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`absolute inset-0 bg-gradient-to-br ${banner.bgGradient} flex items-center`}
            >
              {/* Decorative glows */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#00ff9d]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#ff6b1a]/10 rounded-full blur-3xl" />

              {/* Big emoji bg */}
              <div className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 text-[140px] sm:text-[220px] opacity-30 select-none">
                {banner.emoji}
              </div>

              <div className="relative z-10 px-6 sm:px-12 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00ff9d]/20 border border-[#00ff9d]/40 mb-3">
                  <Flame className="w-3 h-3 text-[#00ff9d]" />
                  <span className="text-[10px] sm:text-xs font-bold text-[#00ff9d] tracking-wider">
                    {banner.tag}
                  </span>
                </div>
                <h3 className="text-3xl sm:text-5xl font-black text-white mb-2 sm:mb-3 leading-tight">
                  {banner.title}
                </h3>
                <p className="text-sm sm:text-base text-white/80 mb-5 sm:mb-7">
                  {banner.subtitle}
                </p>
                <button className="btn-glow-green rounded-full px-5 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-bold">
                  {banner.cta}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Arrows */}
          <button
            onClick={() => go(index - 1, -1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-[#00ff9d]/20 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => go(index + 1, 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-[#00ff9d]/20 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i, i > index ? 1 : -1)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-[#00ff9d]" : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
