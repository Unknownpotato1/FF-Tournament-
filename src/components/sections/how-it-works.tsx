"use client";

import { motion } from "framer-motion";
import {
  LogIn,
  Gamepad2,
  CreditCard,
  Upload,
  Clock,
  Key,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants";

const ICONS: Record<string, LucideIcon> = {
  LogIn,
  Gamepad2,
  CreditCard,
  Upload,
  Clock,
  Key,
  Swords,
  Trophy,
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border border-[#00ff9d]/30 mb-3">
            <Gamepad2 className="w-3.5 h-3.5 text-[#00ff9d]" />
            <span className="text-xs font-bold text-[#00ff9d] tracking-wider uppercase">
              Simple 8-Step Process
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
            How It <span className="text-[#00ff9d] text-glow-green">Works</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            From login to prize money — follow these simple steps to start competing in Free Fire tournaments today.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS_STEPS.map((step, i) => {
            const Icon = ICONS[step.icon];
            const isLast = i === HOW_IT_WORKS_STEPS.length - 1;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.1 }}
                className="relative"
              >
                <div className="glass-card glass-card-hover rounded-xl p-5 h-full group">
                  {/* Step number */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl font-black text-[#00ff9d]/20 group-hover:text-[#00ff9d]/40 transition-colors">
                      {String(step.step).padStart(2, "0")}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00ff9d]/20 to-[#ff6b1a]/10 border border-[#00ff9d]/30 flex items-center justify-center group-hover:glow-green transition-all">
                      <Icon className="w-5 h-5 text-[#00ff9d]" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  {/* Connector arrow on desktop */}
                  {!isLast && i % 4 !== 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-2 z-20 w-4 h-4">
                      <div className="w-2 h-2 rounded-full bg-[#00ff9d]/60 absolute top-1/2 left-0 -translate-y-1/2" />
                    </div>
                  )}
                </div>

                {/* Final "Winner" badge */}
                {isLast && (
                  <div className="absolute -top-3 -right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#00ff9d] to-[#ff6b1a] text-[10px] font-black text-black tracking-wider">
                    🏆 GOAL
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
