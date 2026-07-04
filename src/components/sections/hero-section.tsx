"use client";

import { motion } from "framer-motion";
import { Trophy, HelpCircle, Crosshair, Zap, Users, Wallet } from "lucide-react";
import { useUI } from "@/stores/ui-store";
import { useAuth } from "@/components/auth-provider";

export function HeroSection() {
  const { setScrollTo, openModal } = useUI();
  const { user } = useAuth();

  return (
    <section
      id="hero"
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-8 pb-12"
    >
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      {/* Floating glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#00ff9d]/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#ff6b1a]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-[#00ff9d]/30 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse" />
            <span className="text-xs font-medium text-[#00ff9d] tracking-wider uppercase">
              Live · 12,480+ Players Competing
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-3"
          >
            <span className="block text-white">FF</span>
            <span className="block bg-gradient-to-r from-[#00ff9d] via-[#00ff9d] to-[#ff6b1a] bg-clip-text text-transparent text-glow-green">
              TOURNAMENT
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg sm:text-xl font-bold text-[#ff6b1a] text-glow-orange mb-4 tracking-wide"
          >
            India&apos;s No.1 Free Fire Tournament Platform
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Join exciting Free Fire custom tournaments, compete with real players, and win cash prizes.
            Daily 1v1 &amp; 2v2 Clash Squad matches with instant payouts.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <button
              onClick={() => (user ? setScrollTo("tournaments") : openModal("login"))}
              className="btn-glow-green rounded-full px-8 py-3.5 text-base font-bold flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Trophy className="w-5 h-5" /> Join Tournament
            </button>
            <button
              onClick={() => setScrollTo("how-it-works")}
              className="btn-ghost-glow rounded-full px-8 py-3.5 text-base font-bold flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <HelpCircle className="w-5 h-5" /> How It Works
            </button>
          </motion.div>

          {/* Mini feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            {[
              { icon: Zap, label: "Instant Verification" },
              { icon: Wallet, label: "Daily Payouts" },
              { icon: Users, label: "12,480+ Players" },
              { icon: Crosshair, label: "Fair Play" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-xs text-muted-foreground"
              >
                <item.icon className="w-3.5 h-3.5 text-[#00ff9d]" />
                {item.label}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-[#00ff9d]"
          />
        </div>
      </motion.div>
    </section>
  );
}
