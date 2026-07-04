"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Trophy, LayoutDashboard, Shield, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useUI } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { label: "Home", target: "hero" },
  { label: "Tournaments", target: "tournaments" },
  { label: "How It Works", target: "how-it-works" },
  { label: "Leaderboard", target: "leaderboard" },
  { label: "FAQ", target: "faq" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { openModal, setScrollTo } = useUI();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (target: string) => {
    setMobileOpen(false);
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

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-full glass-card-hover transition-all">
                    <Avatar className="w-7 h-7 border border-[#00ff9d]/30">
                      <AvatarImage src={user.photoURL ?? undefined} alt={user.name} />
                      <AvatarFallback className="bg-[#00ff9d]/20 text-[#00ff9d] text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium pr-1">{user.name.split(" ")[0]}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0c0c12] border-white/10">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-[#00ff9d]/10 hover:text-[#00ff9d]"
                    onClick={() => openModal("dashboard")}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-[#00ff9d]/10 hover:text-[#00ff9d]"
                    onClick={() => handleNav("tournaments")}
                  >
                    <Trophy className="w-4 h-4 mr-2" /> Tournaments
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-[#ff6b1a]/10 hover:text-[#ff6b1a]"
                      onClick={() => openModal("admin")}
                    >
                      <Shield className="w-4 h-4 mr-2" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => logout()}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => openModal("login")}
                className="btn-glow-green hidden sm:flex rounded-full px-5"
                size="sm"
              >
                <LogIn className="w-4 h-4 mr-1.5" /> Login
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-md glass-card"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-3 space-y-1 border-t border-white/5">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.target}
                    onClick={() => handleNav(link.target)}
                    className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-[#00ff9d] hover:bg-[#00ff9d]/5 transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                {!user && (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      openModal("login");
                    }}
                    className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-bold text-[#00ff9d] hover:bg-[#00ff9d]/10 transition-colors"
                  >
                    Login / Register
                  </button>
                )}
                {user && (
                  <>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        openModal("dashboard");
                      }}
                      className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-[#00ff9d] hover:bg-[#00ff9d]/5 transition-colors"
                    >
                      Dashboard
                    </button>
                    {user.role === "admin" && (
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          openModal("admin");
                        }}
                        className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-[#ff6b1a] hover:bg-[#ff6b1a]/5 transition-colors"
                      >
                        Admin Panel
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
