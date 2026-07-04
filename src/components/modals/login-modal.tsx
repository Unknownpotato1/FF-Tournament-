"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUI } from "@/stores/ui-store";
import { useAuth } from "@/components/auth-provider";
import { Loader2, Shield, Zap, Trophy, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function LoginModal() {
  const { activeModal, closeModal } = useUI();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = activeModal === "login";

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const res = await loginWithGoogle();
    setLoading(false);
    if (res.ok) {
      toast.success("Welcome to FF Tournament!", {
        description: "You're now signed in with Google.",
      });
      closeModal();
    } else {
      setError(res.error || "Login failed");
      toast.error("Login failed", { description: res.error });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="sm:max-w-md bg-[#0c0c12] border-white/10 p-0 overflow-hidden">
        <DialogTitle className="sr-only">Login to FF Tournament</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in with Google to join Free Fire tournaments.
        </DialogDescription>

        {/* Header banner */}
        <div className="relative h-28 bg-gradient-to-br from-[#00ff9d]/20 via-[#0c0c12] to-[#ff6b1a]/20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff9d]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff6b1a]/20 rounded-full blur-3xl" />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00ff9d] to-[#ff6b1a] flex items-center justify-center glow-green"
          >
            <Trophy className="w-8 h-8 text-black" strokeWidth={2.5} />
          </motion.div>
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 w-8 h-8 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-6 pt-4">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-white text-center">
              Welcome, <span className="text-[#00ff9d] text-glow-green">Player</span>
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Sign in with Google to join tournaments, track matches, and win cash prizes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-400 leading-relaxed">{error}</p>
              </div>
            )}

            <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
              By signing in, you agree to our Terms &amp; Conditions and Privacy Policy.
              We use Google OAuth for secure authentication — your password is never shared with us.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-white/5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Shield className="w-3 h-3 text-[#00ff9d]" /> Secure
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Zap className="w-3 h-3 text-[#00ff9d]" /> Fast
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Trophy className="w-3 h-3 text-[#00ff9d]" /> Trusted
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
