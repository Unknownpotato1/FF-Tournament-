"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Smartphone, Zap, Bell, X, Check } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_DISMISS_KEY = "ff-install-dismissed";
const INSTALL_DISMISSED_AT_KEY = "ff-install-dismissed-at";
// Re-show popup after 24 hours if user dismissed it
const RE_SHOW_MS = 24 * 60 * 60 * 1000;

export function InstallAppCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isStandalone) {
        setInstalled(true);
        return;
      }
    }

    // Check if dismissed recently (within 24h)
    try {
      const dismissedAt = localStorage.getItem(INSTALL_DISMISSED_AT_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        if (elapsed < RE_SHOW_MS) {
          // Recently dismissed — don't show popup again until 24h passes
          return;
        }
      }
    } catch {
      // localStorage may be blocked
    }

    // Delay initial popup by 4 seconds (let user browse first)
    const initialTimer = setTimeout(() => setShowPopup(true), 4000);

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for appinstalled event
    const installedHandler = () => {
      setInstalled(true);
      setShowPopup(false);
      setDeferredPrompt(null);
      toast.success("FF Tournament installed!", {
        description: "Find it on your home screen.",
      });
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Browser doesn't support auto-prompt (e.g. iOS Safari, desktop Firefox)
      toast.info("How to install", {
        description:
          "On Chrome/Edge: tap the menu (⋮) → 'Install app'. On Safari (iOS): tap Share → 'Add to Home Screen'.",
        duration: 6000,
      });
      return;
    }

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("Installing FF Tournament...", {
          description: "Check your home screen in a few seconds.",
        });
        setShowPopup(false);
      }
      setDeferredPrompt(null);
    } catch {
      toast.error("Install failed", { description: "Try the browser menu → Install app" });
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPopup(false);
    try {
      localStorage.setItem(INSTALL_DISMISSED_AT_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  };

  // Don't render anything if installed
  if (installed) return null;

  return (
    <>
      {/* ===== Bottom Popup Card ===== */}
      <AnimatePresence>
        {showPopup && (
          <>
            {/* Backdrop (transparent on desktop, slight dark on mobile) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleDismiss}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-0"
            />

            {/* Popup card sliding up from bottom */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[61] sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[440px] sm:max-w-[calc(100vw-2rem)]"
            >
              <div className="relative rounded-t-3xl sm:rounded-2xl overflow-hidden border-t-2 sm:border-2 border-[#00ff9d]/40 shadow-2xl glow-green">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c12] via-[#0a0a14] to-[#0c0c12]" />
                <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#00ff9d]/15 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff6b1a]/15 rounded-full blur-3xl" />

                {/* Drag handle (mobile only) */}
                <div className="sm:hidden flex justify-center pt-2.5 pb-1">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="relative p-5 sm:p-6">
                  {/* Header — app icon + title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-[#00ff9d] blur-md opacity-40" />
                      <img
                        src="/logo.png"
                        alt="FF Tournament"
                        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-[#00ff9d]/30"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-[#00ff9d]/15 border border-[#00ff9d]/30 text-[9px] font-bold text-[#00ff9d] uppercase tracking-wider">
                          Get the App
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mt-0.5 leading-tight">
                        Install <span className="text-[#00ff9d]">FF Tournament</span>
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                    Get instant tournament alerts, live match updates, and 1-tap access — right from your home screen.
                  </p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card text-[10px] text-white/80">
                      <Zap className="w-3 h-3 text-[#00ff9d]" /> Lightning fast
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card text-[10px] text-white/80">
                      <Bell className="w-3 h-3 text-[#00ff9d]" /> Instant alerts
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card text-[10px] text-white/80">
                      <Smartphone className="w-3 h-3 text-[#00ff9d]" /> Works offline
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleInstall}
                      disabled={installing}
                      className="btn-glow-green rounded-full px-5 py-3 text-sm font-bold flex items-center justify-center gap-2 flex-1"
                    >
                      {installing ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {installing ? "Installing..." : "Install Now"}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-3 rounded-full glass-card text-xs font-bold text-muted-foreground hover:text-white transition-colors"
                    >
                      Later
                    </button>
                  </div>

                  {/* Trust line */}
                  <div className="mt-3 flex items-center justify-center gap-3 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 text-[#00ff9d]" /> Free
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 text-[#00ff9d]" /> No app store
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 text-[#00ff9d]" /> Android &amp; iPhone
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating re-open button removed per user request */}
    </>
  );
}
