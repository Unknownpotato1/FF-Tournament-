"use client";

import { motion } from "framer-motion";
import { Home, Trophy, LayoutDashboard, User } from "lucide-react";
import { useUI } from "@/stores/ui-store";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NavItem = {
  id: "home" | "tournaments" | "dashboard" | "profile";
  label: string;
  icon: typeof Home;
  target?: string; // scroll target for home/tournaments
  requiresAuth?: boolean;
  modal?: "dashboard" | "profile" | null;
  isProfile?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home, target: "hero" },
  { id: "tournaments", label: "Tournaments", icon: Trophy, target: "tournaments" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, requiresAuth: true, modal: "dashboard" },
  { id: "profile", label: "Profile", icon: User, requiresAuth: true, modal: "profile", isProfile: true },
];

export function BottomNav() {
  const { setScrollTo, openModal } = useUI();
  const { user } = useAuth();

  const handleNav = (item: NavItem) => {
    if (item.requiresAuth && !user) {
      openModal("login");
      return;
    }
    if (item.modal) {
      openModal(item.modal);
    } else if (item.target) {
      setScrollTo(item.target);
    }
  };

  return (
    <>
      {/* Spacer so content doesn't get hidden behind nav */}
      <div className="h-16 sm:h-14" />

      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", damping: 24, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-30 sm:bottom-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto"
      >
        <div className="relative sm:rounded-full">
          {/* Background */}
          <div className="bg-[#0c0c12]/95 backdrop-blur-xl border-t sm:border sm:border-white/10 sm:rounded-full px-2 py-1.5 sm:py-1 sm:px-1.5 shadow-2xl">
            <div className="flex items-center justify-around sm:gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;

                // Profile button: show user's avatar image if logged in,
                // otherwise show the generic User icon
                if (item.isProfile) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item)}
                      className="group relative flex flex-col items-center justify-center gap-0.5 px-4 sm:px-5 py-2 rounded-full transition-all hover:bg-white/5"
                    >
                      {user ? (
                        <Avatar className="w-5 h-5 sm:w-4 sm:h-4 border border-[#00ff9d]/30 group-hover:border-[#00ff9d] transition-colors">
                          <AvatarImage src={user.photoURL ?? undefined} alt={user.name} />
                          <AvatarFallback className="bg-[#00ff9d]/20 text-[#00ff9d] text-[8px] font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Icon className="w-5 h-5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-[#00ff9d] transition-colors" />
                      )}
                      <span className="text-[10px] font-medium text-muted-foreground group-hover:text-[#00ff9d] transition-colors">
                        {item.label}
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item)}
                    className="group relative flex flex-col items-center justify-center gap-0.5 px-4 sm:px-5 py-2 rounded-full transition-all hover:bg-white/5"
                  >
                    <Icon className="w-5 h-5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-[#00ff9d] transition-colors" />
                    <span className="text-[10px] font-medium text-muted-foreground group-hover:text-[#00ff9d] transition-colors">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Glow line on top (mobile only) */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#00ff9d]/40 to-transparent sm:hidden" />
        </div>
      </motion.nav>
    </>
  );
}
