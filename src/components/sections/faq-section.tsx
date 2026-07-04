"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageCircle } from "lucide-react";
import { FAQS } from "@/lib/constants";
import { useUI } from "@/stores/ui-store";

export function FaqSection() {
  const { openModal } = useUI();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Defer to next tick to avoid SSR hydration mismatch with Radix accordion IDs
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <section id="faq" className="py-16 sm:py-20 relative" suppressHydrationWarning>
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border border-[#00ff9d]/30 mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-[#00ff9d]" />
            <span className="text-xs font-bold text-[#00ff9d] tracking-wider uppercase">
              Got Questions?
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Frequently Asked <span className="text-[#00ff9d] text-glow-green">Questions</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Everything you need to know about payments, room details, and prize distribution.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          suppressHydrationWarning
        >
          {mounted ? (
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="glass-card rounded-xl px-5 border-white/5"
                >
                  <AccordionTrigger className="text-left font-bold text-white hover:text-[#00ff9d] transition-colors hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="glass-card rounded-xl px-5 py-5">
                  <div className="text-left font-bold text-white">{faq.q}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Contact CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">Still have questions?</p>
          <button
            onClick={() => openModal("contact")}
            className="btn-ghost-glow rounded-full px-6 py-2.5 text-sm font-bold inline-flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Contact Support
          </button>
        </div>
      </div>
    </section>
  );
}
