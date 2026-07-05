"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUI } from "@/stores/ui-store";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  IndianRupee,
  Loader2,
  X,
  AlertCircle,
  Wallet,
  Send,
  Info,
} from "lucide-react";
import { toast } from "sonner";

const MIN_WITHDRAWAL = 50;
const QUICK_AMOUNTS = [50, 100, 200, 500];

export function WithdrawModal() {
  const { activeModal, closeModal } = useUI();
  const { user, refresh } = useAuth();
  const isOpen = activeModal === "withdraw";

  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentBalance = user?.walletBalance ?? 0;
  const amt = parseInt(amount, 10) || 0;
  const exceedsBalance = amt > currentBalance;
  const belowMin = amt > 0 && amt < MIN_WITHDRAWAL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amt || amt < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal: ₹${MIN_WITHDRAWAL}`);
      return;
    }
    if (exceedsBalance) {
      toast.error("Insufficient balance", { description: `You have only ₹${currentBalance}` });
      return;
    }
    if (!upiId.trim() || !upiId.includes("@")) {
      toast.error("Valid UPI ID required", { description: "e.g. yourname@upi" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          upiId: upiId.trim(),
          note: note.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Withdrawal requested!", {
          description: "Admin will process your withdrawal within 24 hours.",
        });
        setAmount("");
        setUpiId("");
        setNote("");
        await refresh();
        closeModal();
      } else {
        toast.error("Failed", { description: data.error });
      }
    } catch {
      toast.error("Network error", { description: "Please try again" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="sm:max-w-md bg-[#0c0c12] border-white/10 p-0 overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar">
        <DialogTitle className="sr-only">Withdraw Wallet Balance</DialogTitle>
        <DialogDescription className="sr-only">Request a withdrawal to your UPI ID.</DialogDescription>

        {/* Header */}
        <div className="relative h-20 bg-gradient-to-r from-[#ff6b1a]/20 via-[#0c0c12] to-[#00ff9d]/20 flex items-center px-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b1a] to-[#00ff9d] flex items-center justify-center glow-orange">
              <Send className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Wallet</div>
              <div className="text-lg font-black text-white">Withdraw Money</div>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 w-8 h-8 rounded-full glass-card flex items-center justify-center text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {/* Available balance */}
          <div className="glass-card rounded-lg p-3 mb-4 flex items-center justify-between bg-gradient-to-br from-[#00ff9d]/8 to-transparent">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#00ff9d]" /> Available Balance
            </span>
            <span className="text-lg font-black text-[#00ff9d] flex items-center">
              <IndianRupee className="w-4 h-4" />
              {currentBalance.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Amount input */}
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">
              Withdrawal Amount <span className="text-[#ff6b1a]">*</span>
            </Label>
            <div className="relative mt-1">
              <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#ff6b1a]" />
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ₹${MIN_WITHDRAWAL}`}
                min={MIN_WITHDRAWAL}
                max={currentBalance}
                className={`pl-9 bg-white/5 border-white/10 focus:border-[#00ff9d] text-lg font-bold ${
                  exceedsBalance ? "border-red-500/50 focus:border-red-500" : ""
                }`}
                required
              />
            </div>
            {/* Validation messages */}
            {exceedsBalance && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Amount exceeds your balance (₹{currentBalance})
              </p>
            )}
            {belowMin && !exceedsBalance && (
              <p className="text-[11px] text-yellow-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Minimum withdrawal is ₹{MIN_WITHDRAWAL}
              </p>
            )}
            {/* Quick amounts */}
            <div className="flex gap-2 mt-2">
              {QUICK_AMOUNTS.filter((a) => a <= currentBalance).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className="flex-1 py-1.5 rounded-lg glass-card-hover text-xs font-bold text-[#ff6b1a]"
                >
                  ₹{amt}
                </button>
              ))}
              {currentBalance >= MIN_WITHDRAWAL && (
                <button
                  type="button"
                  onClick={() => setAmount(String(currentBalance))}
                  className="flex-1 py-1.5 rounded-lg glass-card-hover text-xs font-bold text-[#00ff9d]"
                >
                  Max
                </button>
              )}
            </div>
          </div>

          {/* UPI ID */}
          <div className="mb-4">
            <Label htmlFor="upiId" className="text-xs text-muted-foreground">
              Your UPI ID <span className="text-[#ff6b1a]">*</span>
            </Label>
            <Input
              id="upiId"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="bg-white/5 border-white/10 focus:border-[#00ff9d] font-mono"
              required
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Payment will be sent to this UPI ID within 24 hours of approval.
            </p>
          </div>

          {/* Note */}
          <div className="mb-4">
            <Label htmlFor="note" className="text-xs text-muted-foreground">
              Note (optional)
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any message for the admin..."
              className="bg-white/5 border-white/10 focus:border-[#00ff9d] resize-none"
              rows={2}
            />
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-[#00ff9d]/5 border border-[#00ff9d]/20 p-3 mb-4">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-[#00ff9d] mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                <div className="font-bold text-[#00ff9d] mb-1">How withdrawal works:</div>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>You request withdrawal (₹{amt || "X"})</li>
                  <li>Admin reviews + sends payment to your UPI</li>
                  <li>Amount deducted from wallet on approval</li>
                  <li>Usually processed within 24 hours</li>
                </ol>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting || exceedsBalance || belowMin || amt === 0}
            className="w-full btn-glow-orange rounded-xl py-3"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {submitting ? "Submitting..." : `Request Withdrawal ₹${amt || "0"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
