"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
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
  Check,
  Upload,
  Loader2,
  X,
  Info,
  AlertCircle,
  Wallet,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

type Settings = {
  upiId: string;
  payeeName: string;
};

async function fetchSettings(): Promise<{ settings: Settings }> {
  const res = await fetch("/api/settings", { cache: "no-store" });
  return res.json();
}

export function RechargeModal() {
  const { activeModal, closeModal } = useUI();
  const { user, refresh } = useAuth();
  const isOpen = activeModal === "recharge";

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 60 * 1000,
  });

  // UPI ID removed — payment is QR code only now
  void settingsData; // keep query alive for future use

  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [note, setNote] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", { description: "Max 2MB allowed" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", { description: "Please upload an image (PNG, JPG)" });
      return;
    }
    if (!user) {
      toast.error("Please login first");
      return;
    }

    setScreenshotPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      // Safe JSON parse — server might return HTML error page
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Server error (HTTP ${res.status}). Please try again or contact support.`);
      }
      const data = await res.json();
      if (data.ok) {
        setScreenshot(data.url);
        toast.success("Screenshot uploaded");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error("Upload failed", { description: msg });
      setScreenshotPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(amount, 10);
    if (!amt || amt < 10) {
      toast.error("Minimum recharge: ₹10");
      return;
    }
    if (!screenshot) {
      toast.error("Please upload payment screenshot");
      return;
    }
    if (!utr.trim() || utr.trim().length < 8) {
      toast.error("Please enter a valid UTR number");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          screenshotURL: screenshot,
          utrNumber: utr.trim(),
          note: note.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Recharge submitted!", {
          description: "Admin will verify your payment within 15-30 minutes.",
        });
        setAmount("");
        setUtr("");
        setNote("");
        setScreenshot(null);
        setScreenshotPreview(null);
        closeModal();
      } else {
        toast.error("Submission failed", { description: data.error });
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
        <DialogTitle className="sr-only">Recharge Wallet</DialogTitle>
        <DialogDescription className="sr-only">Add money to your wallet via UPI.</DialogDescription>

        {/* Header */}
        <div className="relative h-20 bg-gradient-to-r from-[#00ff9d]/20 via-[#0c0c12] to-[#ff6b1a]/20 flex items-center px-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00ff9d] to-[#ff6b1a] flex items-center justify-center glow-green">
              <Wallet className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Wallet</div>
              <div className="text-lg font-black text-white">Recharge Wallet</div>
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
          {/* Current balance */}
          {user && (
            <div className="glass-card rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Current Balance</span>
              <span className="text-lg font-black text-[#00ff9d] flex items-center">
                <IndianRupee className="w-4 h-4" />
                {(user.walletBalance ?? 0).toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Amount input with quick buttons */}
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">
              Recharge Amount <span className="text-[#ff6b1a]">*</span>
            </Label>
            <div className="relative mt-1">
              <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#00ff9d]" />
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (min ₹10)"
                min={10}
                max={100000}
                className="pl-9 bg-white/5 border-white/10 focus:border-[#00ff9d] text-lg font-bold"
                required
              />
            </div>
          </div>

          {/* QR Code — large, no white background, with download button */}
          <div className="mb-4">
            <div className="relative glass-card rounded-xl p-4 border-[#00ff9d]/20">
              <img
                src="/qr-code.jpg"
                alt="Payment QR Code"
                className="w-full max-w-sm mx-auto rounded-lg object-contain"
              />
              {/* Download button */}
              <a
                href="/qr-code.jpg"
                download="ff-tournament-qr.jpg"
                className="absolute top-2 right-2 w-8 h-8 rounded-full glass-card flex items-center justify-center text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-colors"
                title="Download QR Code"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
            <div className="text-xs text-muted-foreground text-center mt-2">Scan QR to pay via any UPI app</div>
          </div>

          {/* Instructions (UPI ID removed — QR code only) */}
          <div className="rounded-lg bg-[#00ff9d]/5 border border-[#00ff9d]/20 p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3.5 h-3.5 text-[#00ff9d]" />
              <span className="text-xs font-bold text-[#00ff9d]">Payment Instructions</span>
            </div>
            <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
              <li>Scan the QR code above with any UPI app</li>
              <li>Pay exactly <span className="text-[#ff6b1a] font-bold">₹{amount || "X"}</span></li>
              <li>Take screenshot of payment success page</li>
              <li>Copy the 12-digit UTR number</li>
              <li>Upload screenshot + enter UTR below</li>
            </ol>
          </div>

          {/* Screenshot upload */}
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Payment Screenshot <span className="text-[#ff6b1a]">*</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {screenshotPreview ? (
              <div className="relative rounded-lg overflow-hidden glass-card">
                <img src={screenshotPreview} alt="Payment screenshot" className="w-full h-40 object-cover" />
                {uploading && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-[#00ff9d] animate-spin" />
                    <span className="text-xs text-white">Uploading...</span>
                  </div>
                )}
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                    className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/70 text-white text-xs hover:bg-red-500/70"
                  >
                    Remove
                  </button>
                )}
                {!uploading && screenshot && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#00ff9d]/90 text-black text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Uploaded
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-lg glass-card border-2 border-dashed border-white/10 hover:border-[#00ff9d]/40 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-[#00ff9d] transition-colors"
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs font-medium">Tap to upload screenshot</span>
                <span className="text-[10px]">PNG, JPG up to 2MB · Cloudinary</span>
              </button>
            )}
          </div>

          {/* UTR */}
          <div className="mb-4">
            <Label htmlFor="utr" className="text-xs text-muted-foreground">
              UTR / Reference Number <span className="text-[#ff6b1a]">*</span>
            </Label>
            <Input
              id="utr"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. 123456789012"
              className="bg-white/5 border-white/10 focus:border-[#00ff9d] font-mono"
              required
            />
          </div>

          {/* Note */}
          <div className="mb-5">
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

          <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-2.5 mb-4 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-yellow-400/80 leading-relaxed">
              Recharge will be <span className="font-bold">pending verification</span>. Admin typically approves within 15-30 minutes.
            </p>
          </div>

          <Button
            type="submit"
            disabled={submitting || uploading}
            className="w-full btn-glow-green rounded-xl py-3"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {submitting ? "Submitting..." : `Submit Recharge ₹${amount || "0"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
