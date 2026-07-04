"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  Scale,
  Wallet,
  Trophy,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import { TRUST_CARDS } from "@/lib/constants";

const ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  Zap,
  Scale,
  Wallet,
  Trophy,
  Headphones,
};

export function TrustSection() {
  return (
    <section className="py-16 sm:py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border border-[#ff6b1a]/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#ff6b1a]" />
            <span className="text-xs font-bold text-[#ff6b1a] tracking-wider uppercase">
              Why Players Trust Us
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Built for <span className="text-[#00ff9d] text-glow-green">Fair Play</span> &amp; Fast Payouts
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Every tournament is hosted with integrity. From secure login to instant prize distribution,
            we&apos;ve built the most reliable Free Fire tournament experience in India.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {TRUST_CARDS.map((card, i) => {
            const Icon = ICONS[card.icon];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="glass-card glass-card-hover rounded-xl p-5 sm:p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#00ff9d]/20 to-[#ff6b1a]/10 border border-[#00ff9d]/30 flex items-center justify-center group-hover:glow-green transition-all">
                    <Icon className="w-6 h-6 text-[#00ff9d]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
