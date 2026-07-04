"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUI } from "@/stores/ui-store";
import { useAuth } from "@/components/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Trophy,
  Calendar,
  CreditCard,
  Bell,
  History,
  Wallet,
  Swords,
  Key,
  LogOut,
  Shield,
  Crown,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  AlertTriangle,
  Pencil,
  Loader2,
  Upload,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Dashboard = {
  profile: { id: string; name: string; email: string; photoURL: string | null; role: string; registeredAt: string };
  stats: { matchesPlayed: number; wins: number; prizeEarned: number };
  upcomingMatches: Array<{
    id: string;
    tournamentId: string;
    title: string;
    type: string;
    date: string;
    time: string;
    roomPublished: boolean;
    roomId: string | null;
    roomPassword: string | null;
  }>;
  joinedTournaments: Array<{
    id: string;
    tournamentId: string;
    title: string;
    type: string;
    date: string;
    time: string;
    status: string;
    tournamentStatus: string;
  }>;
  payments: Array<{
    id: string;
    tournamentTitle: string;
    amount: number;
    status: string;
    submittedAt: string;
    utrNumber: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  }>;
  prizeHistory: Array<{
    id: string;
    tournamentTitle: string;
    tournamentType: string;
    amount: number;
    date: string;
  }>;
  matchHistory: Array<{
    id: string;
    title: string;
    type: string;
    date: string;
    result: string;
    prize: number;
  }>;
};

async function fetchDashboard(): Promise<Dashboard> {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  return res.json();
}

export function DashboardModal() {
  const { activeModal, closeModal } = useUI();
  const { user, logout, refresh } = useAuth();
  const qc = useQueryClient();
  const isOpen = activeModal === "dashboard";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    enabled: isOpen && !!user,
  });

  // ---- Edit Profile state ----
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState<string | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditStart = () => {
    if (data?.profile) {
      setEditName(data.profile.name);
      setEditPhotoURL(data.profile.photoURL);
      setEditPhotoPreview(data.profile.photoURL);
      setEditing(true);
    }
  };

  const handleEditCancel = () => {
    setEditing(false);
    setEditName("");
    setEditPhotoURL(null);
    setEditPhotoPreview(null);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", { description: "Max 2MB allowed" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", { description: "Please upload an image" });
      return;
    }
    // Preview immediately
    setEditPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result.ok) {
        setEditPhotoURL(result.url);
        toast.success("Photo uploaded");
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error("Upload failed", { description: msg });
      setEditPhotoPreview(data?.profile.photoURL ?? null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || editName.trim().length < 2) {
      toast.error("Name too short", { description: "Min 2 characters" });
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          photoURL: editPhotoURL,
        }),
      });
      const result = await res.json();
      if (result.ok) {
        toast.success("Profile updated!");
        setEditing(false);
        // Refresh auth context (updates navbar avatar/name immediately)
        await refresh();
        // Refresh dashboard data
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      } else {
        throw new Error(result.error || "Update failed");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error("Update failed", { description: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleMarkRead = async () => {
    await fetch("/api/notifications", { method: "POST" });
    refetch();
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    toast.success("All notifications marked as read");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="sm:max-w-2xl bg-[#0c0c12] border-white/10 p-0 overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar">
        <DialogTitle className="sr-only">User Dashboard</DialogTitle>
        <DialogDescription className="sr-only">View your matches, payments, notifications, and prize history.</DialogDescription>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#00ff9d]/15 via-[#0c0c12] to-[#ff6b1a]/15 p-5 border-b border-white/5">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 w-8 h-8 rounded-full glass-card flex items-center justify-center text-white hover:bg-white/10 z-10"
          >
            ✕
          </button>
          <div className="relative flex items-center gap-4">
            {isLoading || !data ? (
              <>
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </>
            ) : (
              <>
                {editing ? (
                  // ---- Edit Profile Mode ----
                  <div className="flex-1 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4">
                      {/* Avatar with edit overlay */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-16 h-16 border-2 border-[#00ff9d]/60">
                          <AvatarImage src={editPhotoPreview ?? undefined} alt="Profile" />
                          <AvatarFallback className="bg-[#00ff9d]/20 text-[#00ff9d] text-2xl font-black">
                            {(editName || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#00ff9d] text-black flex items-center justify-center hover:glow-green disabled:opacity-50"
                          aria-label="Change photo"
                        >
                          {uploadingPhoto ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Display Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={40}
                          placeholder="Your name"
                          className="w-full mt-0.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#00ff9d] text-white text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Tap the camera icon to upload a photo from your gallery
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile || uploadingPhoto}
                        className="btn-glow-green rounded-full px-5 py-2 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {savingProfile ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        disabled={savingProfile}
                        className="px-5 py-2 rounded-full glass-card text-xs font-bold text-muted-foreground hover:text-white flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // ---- View Mode (default) ----
                  <>
                    <Avatar className="w-16 h-16 border-2 border-[#00ff9d]/40">
                      <AvatarImage src={data.profile.photoURL ?? undefined} alt={data.profile.name} />
                      <AvatarFallback className="bg-[#00ff9d]/20 text-[#00ff9d] text-2xl font-black">
                        {data.profile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white truncate">{data.profile.name}</h2>
                        {data.profile.role === "admin" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ff6b1a]/20 text-[#ff6b1a] border border-[#ff6b1a]/40 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{data.profile.email}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Joined {new Date(data.profile.registeredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditStart}
                        className="text-[#00ff9d] hover:bg-[#00ff9d]/10 hover:text-[#00ff9d] text-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { logout(); closeModal(); }}
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-400 text-xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Stats row */}
          {!isLoading && data && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              <StatPill icon={Swords} label="Matches" value={data.stats.matchesPlayed} color="green" />
              <StatPill icon={Crown} label="Wins" value={data.stats.wins} color="orange" />
              <StatPill icon={Wallet} label="Prize" value={`₹${data.stats.prizeEarned.toLocaleString("en-IN")}`} color="green" />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="p-4">
          {isLoading || !data ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-transparent p-0 h-auto mb-4">
                <TabsTrigger value="upcoming" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                  <Calendar className="w-4 h-4" /> Upcoming
                </TabsTrigger>
                <TabsTrigger value="joined" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                  <Trophy className="w-4 h-4" /> Joined
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                  <CreditCard className="w-4 h-4" /> Payments
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d] relative">
                  <Bell className="w-4 h-4" /> Alerts
                  {data.notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff6b1a]" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                  <History className="w-4 h-4" /> History
                </TabsTrigger>
                <TabsTrigger value="prizes" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                  <Wallet className="w-4 h-4" /> Prizes
                </TabsTrigger>
              </TabsList>

              {/* Upcoming matches */}
              <TabsContent value="upcoming" className="mt-0 space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {data.upcomingMatches.length === 0 ? (
                  <EmptyState icon={Calendar} text="No upcoming matches yet" />
                ) : (
                  data.upcomingMatches.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-[10px] text-[#00ff9d] uppercase tracking-wider">{m.type === "1v1" ? "1v1" : "2v2"}</div>
                          <div className="font-bold text-white text-sm">{m.title}</div>
                        </div>
                        <div className="text-right text-xs">
                          {m.status === "started" ? (
                            <span className="text-[#ff6b1a] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b1a] animate-pulse" />
                              LIVE
                            </span>
                          ) : m.autoStartAt ? (
                            <span className="text-[#ff6b1a]">
                              Starts {new Date(m.autoStartAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Auto-starts when full</span>
                          )}
                        </div>
                      </div>
                      {m.roomPublished && m.roomId ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="rounded bg-[#00ff9d]/10 border border-[#00ff9d]/30 p-2">
                              <div className="flex items-center gap-1 text-[10px] text-[#00ff9d] mb-0.5">
                                <Key className="w-3 h-3" /> Room ID
                              </div>
                              <div className="font-mono font-bold text-white text-sm">{m.roomId}</div>
                            </div>
                            <div className="rounded bg-[#00ff9d]/10 border border-[#00ff9d]/30 p-2">
                              <div className="flex items-center gap-1 text-[10px] text-[#00ff9d] mb-0.5">
                                <Key className="w-3 h-3" /> Password
                              </div>
                              <div className="font-mono font-bold text-white text-sm">{m.roomPassword}</div>
                            </div>
                          </div>
                          {/* Disqualification warning */}
                          <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-red-400 leading-relaxed">
                              <span className="font-bold">⚠️ Strict Warning:</span> Do NOT invite friends or share the Room ID &amp; Password with anyone.
                              Players who share room credentials will be <span className="font-bold">immediately disqualified</span> without refund.
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-yellow-400 mt-2">
                          <Clock className="w-3 h-3" /> Room details auto-publish 5 mins after slots fill
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </TabsContent>

              {/* Joined tournaments */}
              <TabsContent value="joined" className="mt-0 space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {data.joinedTournaments.length === 0 ? (
                  <EmptyState icon={Trophy} text="No tournaments joined yet" />
                ) : (
                  data.joinedTournaments.map((t) => (
                    <div key={t.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{t.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.type === "1v1" ? "1v1" : "2v2"}{" "}
                          {t.tournamentStatus === "started" && (
                            <span className="text-[#ff6b1a]">· In Progress</span>
                          )}
                          {t.tournamentStatus === "active" && (
                            <span className="text-[#00ff9d]">· Open</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`status-badge status-${t.status}`}>{t.status}</span>
                        {t.tournamentStatus === "completed" && (
                          <span className="text-[10px] text-muted-foreground">Completed</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Payments */}
              <TabsContent value="payments" className="mt-0 space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {data.payments.length === 0 ? (
                  <EmptyState icon={CreditCard} text="No payment history" />
                ) : (
                  data.payments.map((p) => (
                    <div key={p.id} className="glass-card rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-white text-sm">{p.tournamentTitle}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">UTR: {p.utrNumber}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-[#ff6b1a] flex items-center justify-end">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {p.amount}
                          </div>
                          <span className={`status-badge status-${p.status} mt-1`}>{p.status}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Submitted {new Date(p.submittedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Notifications */}
              <TabsContent value="notifications" className="mt-0 space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                <div className="flex justify-end mb-1">
                  <button
                    onClick={handleMarkRead}
                    className="text-[10px] text-[#00ff9d] hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
                {data.notifications.length === 0 ? (
                  <EmptyState icon={Bell} text="No notifications" />
                ) : (
                  data.notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`glass-card rounded-lg p-3 ${!n.read ? "border-l-2 border-l-[#00ff9d]" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {n.type === "payment_approved" && <CheckCircle2 className="w-4 h-4 text-[#00ff9d]" />}
                          {n.type === "payment_rejected" && <XCircle className="w-4 h-4 text-red-400" />}
                          {n.type === "tournament_registered" && <Trophy className="w-4 h-4 text-[#00ff9d]" />}
                          {n.type === "room_published" && <Key className="w-4 h-4 text-[#00ff9d]" />}
                          {n.type === "match_starting" && <Clock className="w-4 h-4 text-yellow-400" />}
                          {n.type === "tournament_completed" && <Crown className="w-4 h-4 text-[#ff6b1a]" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-white">{n.title}</div>
                          <div className="text-xs text-muted-foreground">{n.message}</div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {new Date(n.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* History */}
              <TabsContent value="history" className="mt-0 space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {data.matchHistory.length === 0 ? (
                  <EmptyState icon={History} text="No match history yet" />
                ) : (
                  data.matchHistory.map((m) => (
                    <div key={m.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{m.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.type === "1v1" ? "1v1" : "2v2"} · {new Date(m.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${m.result === "Won" ? "text-[#00ff9d]" : "text-muted-foreground"}`}>
                          {m.result}
                        </div>
                        {m.prize > 0 && (
                          <div className="text-xs text-[#ff6b1a] font-bold">+₹{m.prize}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Prize history */}
              <TabsContent value="prizes" className="mt-0 space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {data.prizeHistory.length === 0 ? (
                  <EmptyState icon={Wallet} text="No prizes won yet" />
                ) : (
                  <>
                    <div className="glass-card rounded-lg p-4 mb-2 text-center bg-gradient-to-br from-[#00ff9d]/10 to-[#ff6b1a]/5">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Prize Won</div>
                      <div className="text-3xl font-black text-[#00ff9d] flex items-center justify-center">
                        <IndianRupee className="w-6 h-6" />
                        {data.stats.prizeEarned.toLocaleString("en-IN")}
                      </div>
                    </div>
                    {data.prizeHistory.map((p) => (
                      <div key={p.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{p.tournamentTitle}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.tournamentType === "1v1" ? "1v1" : "2v2"} · {new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        </div>
                        <div className="text-[#ff6b1a] font-black flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          {p.amount.toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Swords;
  label: string;
  value: string | number;
  color: "green" | "orange";
}) {
  return (
    <div className="glass-card rounded-lg p-2.5 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color === "green" ? "text-[#00ff9d]" : "text-[#ff6b1a]"}`} />
      <div className={`text-base font-black ${color === "green" ? "text-[#00ff9d]" : "text-[#ff6b1a]"}`}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Swords; text: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
