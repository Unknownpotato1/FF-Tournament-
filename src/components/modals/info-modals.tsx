"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUI } from "@/stores/ui-store";
import { Shield, FileText, Mail, Send, Instagram, MessageCircle } from "lucide-react";

export function InfoModals() {
  const { activeModal, closeModal } = useUI();

  return (
    <>
      <Dialog open={activeModal === "privacy"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="sm:max-w-lg bg-[#0c0c12] border-white/10 p-0 overflow-hidden max-h-[88vh] overflow-y-auto custom-scrollbar">
          <DialogTitle className="sr-only">Privacy Policy</DialogTitle>
          <DialogDescription className="sr-only">Read our privacy policy.</DialogDescription>
          <div className="relative bg-gradient-to-r from-[#00ff9d]/15 to-[#0c0c12] p-5 border-b border-white/5">
            <button onClick={closeModal} className="absolute top-3 right-3 w-8 h-8 rounded-full glass-card flex items-center justify-center text-white hover:bg-white/10">✕</button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00ff9d]/20 border border-[#00ff9d]/40 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#00ff9d]" />
              </div>
              <h2 className="text-xl font-black text-white">Privacy Policy</h2>
            </div>
          </div>
          <div className="p-5 text-sm text-muted-foreground leading-relaxed space-y-3">
            <p><strong className="text-white">1. Information We Collect.</strong> We collect your name, email address, profile photo, and Google UID when you sign in with Google. We also collect tournament registration data, payment UTR numbers, and payment screenshots for verification purposes.</p>
            <p><strong className="text-white">2. How We Use Your Information.</strong> Your information is used to register you for tournaments, verify your payments, distribute prize money, and send you notifications about upcoming matches and tournament results. We never sell your data to third parties.</p>
            <p><strong className="text-white">3. Data Storage.</strong> Your data is stored securely in Firebase Firestore with industry-standard encryption. Payment screenshots are stored in Firebase Storage with restricted access. Only admin users can view payment-related information.</p>
            <p><strong className="text-white">4. Data Retention.</strong> We retain your account information for as long as your account is active. You may request deletion of your account at any time by contacting support. Tournament and payment records are kept for 2 years for audit purposes.</p>
            <p><strong className="text-white">5. Third-Party Services.</strong> We use Google OAuth for authentication, Firebase for data storage, and UPI for payment processing. These services have their own privacy policies that you should review.</p>
            <p><strong className="text-white">6. Your Rights.</strong> You have the right to access, correct, or delete your personal information. You can export your tournament history from your dashboard or request a complete data export by contacting support.</p>
            <p><strong className="text-white">7. Contact.</strong> For privacy concerns, email us at <span className="text-[#00ff9d]">privacy@fftournament.in</span> or message us on Telegram <span className="text-[#00ff9d]">@fftournament</span>.</p>
            <p className="text-xs text-muted-foreground/70 pt-2">Last updated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "terms"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="sm:max-w-lg bg-[#0c0c12] border-white/10 p-0 overflow-hidden max-h-[88vh] overflow-y-auto custom-scrollbar">
          <DialogTitle className="sr-only">Terms and Conditions</DialogTitle>
          <DialogDescription className="sr-only">Read our terms and conditions.</DialogDescription>
          <div className="relative bg-gradient-to-r from-[#ff6b1a]/15 to-[#0c0c12] p-5 border-b border-white/5">
            <button onClick={closeModal} className="absolute top-3 right-3 w-8 h-8 rounded-full glass-card flex items-center justify-center text-white hover:bg-white/10">✕</button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ff6b1a]/20 border border-[#ff6b1a]/40 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#ff6b1a]" />
              </div>
              <h2 className="text-xl font-black text-white">Terms &amp; Conditions</h2>
            </div>
          </div>
          <div className="p-5 text-sm text-muted-foreground leading-relaxed space-y-3">
            <p><strong className="text-white">1. Eligibility.</strong> You must be at least 18 years old (or have parental consent) and a resident of India to participate in FF Tournament. By registering, you confirm that you meet these requirements.</p>
            <p><strong className="text-white">2. Account Registration.</strong> You must sign in with a valid Google account. You are responsible for maintaining the security of your account and for all activities that occur under your account. Sharing accounts is strictly prohibited.</p>
            <p><strong className="text-white">3. Tournament Rules.</strong> All tournaments follow strict fair-play rules. Hacking, teaming (in solo modes), emulator usage in mobile-only tournaments, account sharing, and any form of cheating result in immediate disqualification without refund. Admin decisions are final.</p>
            <p><strong className="text-white">4. Payment &amp; Refunds.</strong> Entry fees must be paid via UPI to the official FF Tournament UPI ID only. After payment, you must submit a screenshot and UTR number for verification. Entry fees are non-refundable once approved. Refunds are only issued if a tournament is cancelled by the admin.</p>
            <p><strong className="text-white">5. Prize Distribution.</strong> Winners receive cash prizes via UPI within 24 hours of match completion. The prize amount is determined by the admin and displayed on each tournament card. Tax liabilities (if any) are the responsibility of the winner.</p>
            <p><strong className="text-white">6. Code of Conduct.</strong> Be respectful to other players, admins, and support staff. Harassment, hate speech, or abusive behavior in chats or social media will result in account suspension. Multiple violations lead to permanent ban.</p>
            <p><strong className="text-white">7. Limitation of Liability.</strong> FF Tournament is not liable for any losses arising from internet connectivity issues, device failures, or game bugs during matches. We reserve the right to cancel or reschedule tournaments due to unforeseen circumstances.</p>
            <p><strong className="text-white">8. Changes to Terms.</strong> We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
            <p className="text-xs text-muted-foreground/70 pt-2">Last updated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "contact"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="sm:max-w-md bg-[#0c0c12] border-white/10 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Contact Support</DialogTitle>
          <DialogDescription className="sr-only">Contact our support team via Telegram, Instagram, or email.</DialogDescription>
          <div className="relative bg-gradient-to-r from-[#00ff9d]/15 via-[#0c0c12] to-[#ff6b1a]/15 p-5 border-b border-white/5">
            <button onClick={closeModal} className="absolute top-3 right-3 w-8 h-8 rounded-full glass-card flex items-center justify-center text-white hover:bg-white/10">✕</button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00ff9d] to-[#ff6b1a] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-xl font-black text-white">Contact Support</h2>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is available 24/7. Average response time: under 10 minutes during tournament hours.
            </p>
            <a href="https://t.me/fftournament" target="_blank" rel="noopener noreferrer" className="glass-card glass-card-hover rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00ff9d]/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-[#00ff9d]" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-sm">Telegram</div>
                <div className="text-xs text-muted-foreground">@fftournament · Fastest response</div>
              </div>
              <div className="text-[#00ff9d] text-xs font-bold">OPEN →</div>
            </a>
            <a href="https://instagram.com/ff.tournament.india" target="_blank" rel="noopener noreferrer" className="glass-card glass-card-hover rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ff6b1a]/20 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-[#ff6b1a]" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-sm">Instagram</div>
                <div className="text-xs text-muted-foreground">@ff.tournament.india</div>
              </div>
              <div className="text-[#ff6b1a] text-xs font-bold">OPEN →</div>
            </a>
            <a href="mailto:support@fftournament.in" className="glass-card glass-card-hover rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-sm">Email</div>
                <div className="text-xs text-muted-foreground">support@fftournament.in</div>
              </div>
              <div className="text-white text-xs font-bold">OPEN →</div>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
