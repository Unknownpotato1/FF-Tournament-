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
  Copy,
  Check,
  Upload,
  Loader2,
  X,
  Info,
  AlertCircle,
  Wallet,
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

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export function RechargeModal() {
  const { activeModal, closeModal } = useUI();
  const { user, refresh } = useAuth();
  const isOpen = activeModal === "recharge";

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 60 * 1000,
  });

  const UPI_ID = settingsData?.settings?.upiId || "fftournament@upi";
  const PAYEE_NAME = settingsData?.settings?.payeeName || "FF Tournament";

  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [note, setNote] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("UPI ID copied to clipboard");
  };

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

  const qrSvg = generateQrLikeSvg();

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
            <div className="flex gap-2 mt-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className="flex-1 py-1.5 rounded-lg glass-card-hover text-xs font-bold text-[#00ff9d]"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center mb-4">
            <div className="inline-block p-3 bg-white rounded-xl">
              <div className="w-44 h-44" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>
            <div className="text-xs text-muted-foreground mt-2">Scan to pay via any UPI app</div>
          </div>

          {/* UPI ID */}
          <div className="glass-card rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">UPI ID</div>
                <div className="font-mono font-bold text-white text-sm">{UPI_ID}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Payee: {PAYEE_NAME}</div>
              </div>
              <button
                type="button"
                onClick={handleCopyUPI}
                className="px-3 py-1.5 rounded-full glass-card-hover text-xs font-bold text-[#00ff9d] flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-lg bg-[#00ff9d]/5 border border-[#00ff9d]/20 p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3.5 h-3.5 text-[#00ff9d]" />
              <span className="text-xs font-bold text-[#00ff9d]">Payment Instructions</span>
            </div>
            <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
              <li>Scan QR or pay to UPI ID: <span className="font-mono text-white">{UPI_ID}</span></li>
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

// Generate a QR-code-like SVG (visual placeholder only)
function generateQrLikeSvg() {
  const size = 22;
  const cells: string[] = [];
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inCorner =
        (x < 7 && y < 7) ||
        (x >= size - 7 && y < 7) ||
        (x < 7 && y >= size - 7);
      if (inCorner) {
        const cx = x < 7 ? x : x - (size - 7);
        const cy = y < 7 ? y : y - (size - 7);
        const isBorder = cx === 0 || cx === 6 || cy === 0 || cy === 6;
        const isInner = cx >= 2 && cx <= 4 && cy >= 2 && cy <= 4;
        if (isBorder || isInner) {
          cells.push(`<rect x="${x * 8}" y="${y * 8}" width="8" height="8" fill="#000"/>`);
        }
        continue;
      }
      if (rand() > 0.5) {
        cells.push(`<rect x="${x * 8}" y="${y * 8}" width="8" height="8" fill="#000"/>`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size * 8} ${size * 8}" width="100%" height="100%">${cells.join("")}</svg>`;
}
