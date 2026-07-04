"use client";

import { Crosshair, Send, Instagram, Mail, Shield, FileText, Headphones } from "lucide-react";
import { useUI } from "@/stores/ui-store";

const FOOTER_LINKS = [
  { label: "Privacy Policy", target: "privacy" as const, icon: Shield },
  { label: "Terms & Conditions", target: "terms" as const, icon: FileText },
  { label: "Contact Support", target: "contact" as const, icon: Headphones },
];

const SOCIAL_LINKS = [
  { label: "Telegram", icon: Send, href: "https://t.me/fftournament" },
  { label: "Instagram", icon: Instagram, href: "https://instagram.com/ff.tournament.india" },
  { label: "Email", icon: Mail, href: "mailto:support@fftournament.in" },
];

export function Footer() {
  const { openModal } = useUI();
  return (
    <footer className="mt-auto relative border-t border-white/5 bg-[#080810]">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00ff9d] to-[#ff6b1a] flex items-center justify-center">
                <Crosshair className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <div className="font-black text-lg">
                <span className="text-white">FF</span>
                <span className="text-[#00ff9d]">Tournament</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed max-w-xs">
              India&apos;s No.1 Free Fire Tournament Platform. Compete in custom 1v1 &amp; 2v2 Clash Squad
              tournaments and win real cash prizes.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#00ff9d]">
              <span className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse" />
              <span className="font-semibold">All systems operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.target}>
                  <button
                    onClick={() => openModal(link.target)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#00ff9d] transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5" /> {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Connect With Us</h4>
            <ul className="space-y-2">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#00ff9d] transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5" /> {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} FF Tournament. All rights reserved.</p>
          <p>Made with <span className="text-[#00ff9d]">♥</span> for Indian Free Fire gamers</p>
        </div>
      </div>
    </footer>
  );
}
