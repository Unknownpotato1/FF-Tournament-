"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, LogIn, Wallet, Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useUI } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_LINKS = [
  { label: "Home", target: "hero" },
  { label: "Tournaments", target: "tournaments" },
  { label: "How It Works", target: "how-it-works" },
  { label: "Leaderboard", target: "leaderboard" },
  { label: "FAQ", target: "faq" },
];

export function Navbar() {
  const { user } = useAuth();
  const { openModal, setScrollTo } = useUI();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (target: string) => {
    setScrollTo(target);
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-[#050507]/85 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <button
            onClick={() => handleNav("hero")}
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#00ff9d] blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
              <img
                src="/logo.png"
                alt="FF Tournament Logo"
                className="relative w-10 h-10 rounded-lg object-cover"
              />
            </div>
            <div className="text-left leading-none">
              <div className="font-black text-lg tracking-tight">
                <span className="text-white">FF</span>
                <span className="text-[#00ff9d] text-glow-green">Tournament</span>
              </div>
              <div className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase mt-0.5">
                India&apos;s No.1
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.target}
                onClick={() => handleNav(link.target)}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-[#00ff9d] transition-colors rounded-md"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side — wallet + admin */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Wallet balance pill */}
                <button
                  onClick={() => openModal("recharge")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border-[#00ff9d]/30 hover:border-[#00ff9d]/60 transition-colors group"
                  title="Tap to recharge wallet"
                >
                  <Wallet className="w-4 h-4 text-[#00ff9d]" />
                  <span className="text-sm font-bold text-white tabular-nums">
                    ₹{(user.walletBalance ?? 0).toLocaleString("en-IN")}
                  </span>
                  <div className="w-5 h-5 rounded-full bg-[#00ff9d] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-3 h-3 text-black" strokeWidth={3} />
                  </div>
                </button>

                {/* Admin shortcut (only for admins) */}
                {user.role === "admin" && (
                  <button
                    onClick={() => openModal("admin")}
                    className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full glass-card border-[#ff6b1a]/30 hover:border-[#ff6b1a]/60 text-[#ff6b1a] transition-colors"
                    title="Admin Panel"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                )}

                {/* Avatar (tap to open profile via bottom nav) — kept small */}
                <button
                  onClick={() => openModal("profile")}
                  className="hidden sm:block"
                >
                  <Avatar className="w-8 h-8 border border-[#00ff9d]/30">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.name} />
                    <AvatarFallback className="bg-[#00ff9d]/20 text-[#00ff9d] text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </>
            ) : (
              <Button
                onClick={() => openModal("login")}
                className="btn-glow-green hidden sm:flex rounded-full px-5"
                size="sm"
              >
                <LogIn className="w-4 h-4 mr-1.5" /> Login
              </Button>
            )}

            {/* Mobile menu button removed — using bottom nav instead */}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
