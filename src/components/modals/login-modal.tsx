"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUI } from "@/stores/ui-store";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, User, Shield, Zap, Trophy } from "lucide-react";
import { toast } from "sonner";

export function LoginModal() {
  const { activeModal, closeModal } = useUI();
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [mode, setMode] = useState<"google" | "email">("google");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);

  const isOpen = activeModal === "login";

  const handleGoogle = async () => {
    setLoading("google");
    const res = await loginWithGoogle();
    setLoading(null);
    if (res.ok) {
      toast.success("Welcome to FF Tournament!", {
        description: "You're now signed in with Google.",
      });
      closeModal();
    } else {
      toast.error("Login failed", { description: res.error });
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading("email");
    const res = await loginWithEmail(email, name);
    setLoading(null);
    if (res.ok) {
      toast.success("Welcome to FF Tournament!", {
        description: "Your account is ready.",
      });
      closeModal();
    } else {
      toast.error("Login failed", { description: res.error });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="sm:max-w-md bg-[#0c0c12] border-white/10 p-0 overflow-hidden">
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
              Sign in to join tournaments, track matches, and win cash prizes.
            </DialogDescription>
          </DialogHeader>

          {/* Mode toggle */}
          <div className="flex gap-2 p-1 rounded-full glass-card mb-5">
            <button
              onClick={() => setMode("google")}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                mode === "google" ? "btn-glow-green" : "text-muted-foreground hover:text-white"
              }`}
            >
              Google Login
            </button>
            <button
              onClick={() => setMode("email")}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                mode === "email" ? "btn-glow-green" : "text-muted-foreground hover:text-white"
              }`}
            >
              Email Login
            </button>
          </div>

          {mode === "google" ? (
            <div className="space-y-4">
              <button
                onClick={handleGoogle}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                {loading === "google" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continue with Google
              </button>
              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                By signing in, you agree to our Terms &amp; Conditions and Privacy Policy.
                We use Google OAuth for secure authentication.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmail} className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-xs text-muted-foreground">
                  Full Name
                </Label>
                <div className="relative mt-1">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="pl-9 bg-white/5 border-white/10 focus:border-[#00ff9d]"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  Email Address
                </Label>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-9 bg-white/5 border-white/10 focus:border-[#00ff9d]"
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Tip: use an email ending in <code className="text-[#00ff9d]">@admin.in</code> to register as admin.
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading !== null}
                className="w-full btn-glow-green rounded-xl py-3"
              >
                {loading === "email" ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Continue
              </Button>
            </form>
          )}

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
