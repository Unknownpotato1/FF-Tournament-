"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Zap, Bell, X, Check } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_DISMISS_KEY = "ff-install-dismissed";

export function InstallAppCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    try {
      if (localStorage.getItem(INSTALL_DISMISS_KEY) === "1") {
        setDismissed(true);
        return;
      }
    } catch {
      // localStorage may be blocked
    }

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

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for appinstalled event
    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      toast.success("FF Tournament installed!", {
        description: "Find it on your home screen.",
      });
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
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
      }
      setDeferredPrompt(null);
    } catch {
      toast.error("Install failed", { description: "Try the browser menu → Install app" });
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(INSTALL_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    toast.success("Got it!", { description: "You can install anytime from the browser menu." });
  };

  // Don't render if installed or dismissed
  if (installed || dismissed) return null;

  return (
    <section className="py-6 sm:py-8 relative">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden border border-[#00ff9d]/30"
        >
          {/* Background gradient + pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00ff9d]/15 via-[#0c0c12] to-[#ff6b1a]/15" />
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#00ff9d]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#ff6b1a]/15 rounded-full blur-3xl" />

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative p-5 sm:p-7">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-5 md:gap-7 items-center">
              {/* App icon + label */}
              <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-2">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-[#00ff9d] blur-md opacity-40" />
                  <img
                    src="/logo.png"
                    alt="FF Tournament App"
                    className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-[#00ff9d]/30"
                  />
                </div>
                <div className="md:hidden">
                  <div className="font-black text-base text-white">FF Tournament</div>
                  <div className="text-[10px] text-[#00ff9d] uppercase tracking-wider">PWA · Free · No Store</div>
                </div>
              </div>

              {/* Text + features */}
              <div className="min-w-0">
                <div className="hidden md:flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-[#00ff9d]/15 border border-[#00ff9d]/30 text-[9px] font-bold text-[#00ff9d] uppercase tracking-wider">
                    Get the App
                  </span>
                  <span className="text-[10px] text-muted-foreground">No Play Store needed</span>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white mb-1.5 leading-tight">
                  Install <span className="text-[#00ff9d] text-glow-green">FF Tournament</span> App
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                  Get instant access to live tournaments, real-time match updates, and instant room notifications — right from your home screen.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                    <div className="w-5 h-5 rounded-full bg-[#00ff9d]/15 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-[#00ff9d]" />
                    </div>
                    Lightning fast
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                    <div className="w-5 h-5 rounded-full bg-[#00ff9d]/15 flex items-center justify-center">
                      <Bell className="w-3 h-3 text-[#00ff9d]" />
                    </div>
                    Instant alerts
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                    <div className="w-5 h-5 rounded-full bg-[#00ff9d]/15 flex items-center justify-center">
                      <Smartphone className="w-3 h-3 text-[#00ff9d]" />
                    </div>
                    Works offline
                  </div>
                </div>
              </div>

              {/* Install button */}
              <div className="flex flex-col gap-2 md:items-end">
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="btn-glow-green rounded-full px-5 sm:px-7 py-3 text-sm font-bold flex items-center justify-center gap-2 w-full md:w-auto whitespace-nowrap"
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
                  className="text-[10px] text-muted-foreground hover:text-white transition-colors md:text-right"
                >
                  Maybe later
                </button>
              </div>
            </div>

            {/* Bottom strip - mini value prop */}
            <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-[#00ff9d]" /> Free to install
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-[#00ff9d]" /> No app store required
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-[#00ff9d]" /> Works on Android &amp; iPhone
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-[#00ff9d]" /> Push notifications
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
