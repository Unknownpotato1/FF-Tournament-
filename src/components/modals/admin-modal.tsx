"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUI } from "@/stores/ui-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield,
  Users,
  CreditCard,
  Trophy,
  Key,
  Plus,
  Check,
  X,
  Crown,
  IndianRupee,
  Loader2,
  Trash2,
  Lock,
  Pencil,
  Settings,
  Zap,
  Wallet,
  Send,
  User,
  MessageCircle,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

// ============ Stats Tab ============
function AdminStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      return res.json();
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const stats = data?.stats;
  if (!stats) return null;

  const items = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "green" },
    { label: "Total Registrations", value: stats.totalRegistrations, icon: Trophy, color: "orange" },
    { label: "Pending Payments", value: stats.pendingPayments, icon: CreditCard, color: "yellow" },
    { label: "Approved Payments", value: stats.approvedPayments, icon: Check, color: "green" },
    { label: "Rejected Payments", value: stats.rejectedPayments, icon: X, color: "red" },
    { label: "Active Tournaments", value: stats.activeTournaments, icon: Trophy, color: "green" },
    { label: "Completed Tournaments", value: stats.completedTournaments, icon: Crown, color: "orange" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card rounded-lg p-3"
        >
          <item.icon className={`w-5 h-5 mb-1.5 ${
            item.color === "green" ? "text-[#00ff9d]" :
            item.color === "orange" ? "text-[#ff6b1a]" :
            item.color === "yellow" ? "text-yellow-400" :
            item.color === "red" ? "text-red-400" : ""
          }`} />
          <div className="text-2xl font-black text-white">{item.value.toLocaleString("en-IN")}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ============ Tournaments Tab ============
function AdminTournaments() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "1v1",
    title: "",
    entryFee: "20",
    prizeAmount: "100",
    slotLimit: "48",
    rules: "Standard Free Fire Clash Squad rules. No hacking, no teaming, fair play only. Tournament starts automatically when all slots are filled.",
  });
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tournaments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tournaments", { cache: "no-store" });
      return res.json();
    },
  });

  const resetForm = () => {
    setForm({
      type: "1v1",
      title: "",
      entryFee: "20",
      prizeAmount: "100",
      slotLimit: "48",
      rules: "Standard Free Fire Clash Squad rules. No hacking, no teaming, fair play only. Tournament starts automatically when all slots are filled.",
    });
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      if (editingId) {
        // Update existing tournament
        const res = await fetch("/api/admin/tournaments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form }),
        });
        const data = await res.json();
        if (data.ok) {
          toast.success("Tournament updated successfully");
          resetForm();
          setShowForm(false);
          qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
          qc.invalidateQueries({ queryKey: ["tournaments"] });
        } else {
          toast.error("Failed", { description: data.error });
        }
      } else {
        // Create new tournament
        const res = await fetch("/api/admin/tournaments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.ok) {
          toast.success("Tournament created successfully");
          resetForm();
          setShowForm(false);
          qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
          qc.invalidateQueries({ queryKey: ["tournaments"] });
        } else {
          toast.error("Failed", { description: data.error });
        }
      }
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (t: any) => {
    setForm({
      type: t.type,
      title: t.title,
      entryFee: String(t.entryFee),
      prizeAmount: String(t.prizeAmount),
      slotLimit: String(t.slotLimit),
      rules: t.rules || "",
    });
    setEditingId(t.id);
    setShowForm(true);
    // Scroll to top of form
    setTimeout(() => {
      document.querySelector("[data-tournament-form]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleCancelEdit = () => {
    resetForm();
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tournament? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/tournaments?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      toast.success("Tournament deleted");
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
    } else {
      toast.error("Failed", { description: data.error });
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "completed" : "active";
    const res = await fetch("/api/admin/tournaments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success(`Tournament ${newStatus === "active" ? "activated" : "deactivated"}`);
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">
          Manage Tournaments {editingId && <span className="text-[#ff6b1a]">· Editing</span>}
        </h3>
        <Button
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              setShowForm(true);
            }
          }}
          size="sm"
          className="btn-glow-green rounded-full text-xs"
        >
          {showForm ? (
            <>Cancel</>
          ) : (
            <><Plus className="w-3.5 h-3.5 mr-1" /> New</>
          )}
        </Button>
      </div>

      {showForm && (
        <motion.form
          data-tournament-form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleCreate}
          className="glass-card rounded-lg p-4 space-y-3 border-2 border-[#00ff9d]/40"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="text-sm font-bold text-[#00ff9d]">
              {editingId ? "✏️ Edit Tournament" : "➕ Create New Tournament"}
            </div>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[10px] text-muted-foreground hover:text-white"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1v1">1v1 Clash Squad</SelectItem>
                  <SelectItem value="2v2">2v2 Clash Squad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Solo Showdown #1"
                className="bg-white/5 border-white/10"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Entry Fee ₹</Label>
              <Input type="number" value={form.entryFee} onChange={(e) => setForm({ ...form, entryFee: e.target.value })} className="bg-white/5 border-white/10" required />
            </div>
            <div>
              <Label className="text-xs">Prize ₹</Label>
              <Input type="number" value={form.prizeAmount} onChange={(e) => setForm({ ...form, prizeAmount: e.target.value })} className="bg-white/5 border-white/10" required />
            </div>
            <div>
              <Label className="text-xs">Slots</Label>
              <Input type="number" value={form.slotLimit} onChange={(e) => setForm({ ...form, slotLimit: e.target.value })} className="bg-white/5 border-white/10" required />
            </div>
          </div>
          <div className="glass-card rounded-lg p-3 bg-[#00ff9d]/5 border-[#00ff9d]/20">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-[#00ff9d]" />
              <span className="text-xs font-bold text-[#00ff9d]">Auto-Start Mode</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tournament starts automatically when all {form.slotLimit || "?"} slots are filled.
              Room ID &amp; Password will be published to approved players 5 minutes after slots fill.
            </p>
          </div>
          <div>
            <Label className="text-xs">Rules</Label>
            <Textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} className="bg-white/5 border-white/10 resize-none" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={creating} className="btn-glow-green flex-1 rounded-full text-xs">
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingId ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {editingId ? "Update Tournament" : "Create Tournament"}
            </Button>
            <Button type="button" variant="ghost" onClick={handleCancelEdit} className="rounded-full text-xs">
              Cancel
            </Button>
          </div>
        </motion.form>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
          {data?.tournaments?.map((t: any) => (
            <div key={t.id} className="glass-card rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#00ff9d] uppercase">{t.type}</span>
                    <span className={`status-badge status-${t.status}`}>{t.status}</span>
                    {t.roomPublished && <span className="status-badge status-approved">Room Published</span>}
                  </div>
                  <div className="font-bold text-white text-sm mt-1">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    ₹{t.entryFee} entry · ₹{t.prizeAmount} prize · {t.filledSlots}/{t.slotLimit} filled
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {t.status === "active" && t.filledSlots < t.slotLimit ? (
                      <span className="text-[#00ff9d]">⚡ Auto-starts when slots fill · {t.slotLimit - t.filledSlots} left</span>
                    ) : t.status === "started" ? (
                      <span className="text-[#ff6b1a]">🎮 In progress</span>
                    ) : (
                      <span>{t.status}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  <button
                    onClick={() => handleEdit(t)}
                    className="px-2 py-1 rounded text-[10px] font-bold glass-card-hover text-[#ff6b1a] flex items-center gap-1"
                    title="Edit tournament"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleToggle(t.id, t.status)}
                    className="px-2 py-1 rounded text-[10px] font-bold glass-card-hover text-[#00ff9d]"
                  >
                    {t.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="px-2 py-1 rounded text-[10px] font-bold glass-card-hover text-red-400"
                    title="Delete tournament"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Payments Tab ============
function AdminPayments() {
  const qc = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const res = await fetch("/api/payments", { cache: "no-store" });
      return res.json();
    },
  });

  const handleAction = async (paymentId: string, action: "approve" | "reject") => {
    setActionLoading(paymentId + action);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Payment ${action === "approve" ? "approved" : "rejected"}`);
        qc.invalidateQueries({ queryKey: ["admin-payments"] });
        qc.invalidateQueries({ queryKey: ["admin-stats"] });
      } else {
        toast.error("Failed", { description: data.error });
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const payments = data?.payments ?? [];
  const pending = payments.filter((p: any) => p.status === "pending");

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white">Payment Verification ({pending.length} pending)</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No payments yet</div>
        ) : (
          payments.map((p: any) => (
            <div key={p.id} className="glass-card rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#00ff9d]/20 flex items-center justify-center text-[#00ff9d] font-bold text-sm">
                    {p.userName?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{p.userName}</div>
                    <div className="text-[10px] text-muted-foreground">{p.userEmail}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-[#ff6b1a] flex items-center justify-end">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {p.amount}
                  </div>
                  <span className={`status-badge status-${p.status}`}>{p.status}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                <span className="text-white font-semibold">{p.tournamentTitle}</span> ·{" "}
                {p.tournamentType === "1v1" ? "1v1" : "2v2"} ·{" "}
                <span className="text-[#00ff9d]">{p.filledSlots ?? 0}/{p.slotLimit ?? 0} slots</span>{" "}
                {p.tournamentStatus === "started" && (
                  <span className="text-[#ff6b1a] ml-1">· In Progress</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="glass-card rounded p-2">
                  <div className="text-[10px] text-muted-foreground mb-1">Screenshot</div>
                  {p.screenshotURL?.startsWith("data:") ? (
                    <img src={p.screenshotURL} alt="Payment" className="w-full h-20 object-cover rounded" />
                  ) : (
                    <div className="w-full h-20 rounded bg-white/5 flex items-center justify-center text-[10px] text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="glass-card rounded p-2">
                  <div className="text-[10px] text-muted-foreground mb-1">UTR Number</div>
                  <div className="font-mono text-xs text-white break-all">{p.utrNumber}</div>
                  {p.note && (
                    <div className="mt-1 text-[10px] text-muted-foreground italic">"{p.note}"</div>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground mb-2">
                Submitted {new Date(p.submittedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
              {p.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAction(p.id, "approve")}
                    disabled={actionLoading === p.id + "approve"}
                    size="sm"
                    className="btn-glow-green flex-1 rounded-full text-xs"
                  >
                    {actionLoading === p.id + "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleAction(p.id, "reject")}
                    disabled={actionLoading === p.id + "reject"}
                    size="sm"
                    variant="ghost"
                    className="flex-1 rounded-full text-xs text-red-400 hover:bg-red-500/10"
                  >
                    {actionLoading === p.id + "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============ Rooms Tab ============
function AdminRooms() {
  const qc = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [publishing, setPublishing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tournaments-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tournaments", { cache: "no-store" });
      return res.json();
    },
  });

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament || !roomId || !roomPassword) {
      toast.error("Fill all fields");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: selectedTournament, roomId, roomPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Room details published! Approved players notified.");
        setRoomId("");
        setRoomPassword("");
        qc.invalidateQueries({ queryKey: ["admin-tournaments-rooms"] });
      } else {
        toast.error("Failed", { description: data.error });
      }
    } finally {
      setPublishing(false);
    }
  };

  // Show both "active" (open for registration) AND "started" (slots full / in progress)
  // tournaments — admin can publish rooms for either state
  const tournaments = (data?.tournaments ?? []).filter(
    (t: any) => t.status === "active" || t.status === "started"
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white">Room Management</h3>
      <form onSubmit={handlePublish} className="glass-card rounded-lg p-4 space-y-3">
        <div>
          <Label className="text-xs">Tournament</Label>
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select tournament" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title} ({t.type}) · {t.filledSlots} joined
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Room ID</Label>
          <Input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="e.g. 12345678" className="bg-white/5 border-white/10 font-mono" required />
        </div>
        <div>
          <Label className="text-xs">Room Password</Label>
          <Input value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} placeholder="e.g. fftour2026" className="bg-white/5 border-white/10 font-mono" required />
        </div>
        <Button type="submit" disabled={publishing} className="btn-glow-green w-full rounded-full text-xs">
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
          Publish Room Details
        </Button>
      </form>

      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
        <div className="text-xs text-muted-foreground">Published rooms:</div>
        {tournaments.filter((t: any) => t.roomPublished).map((t: any) => (
          <div key={t.id} className="glass-card rounded-lg p-3">
            <div className="text-sm font-bold text-white">{t.title}</div>
            <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 mt-1">
              <div>Room: <span className="font-mono text-[#00ff9d]">{t.roomId}</span></div>
              <div>Pass: <span className="font-mono text-[#00ff9d]">{t.roomPassword}</span></div>
            </div>
          </div>
        ))}
        {tournaments.filter((t: any) => t.roomPublished).length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">No rooms published yet</div>
        )}
      </div>
    </div>
  );
}

// ============ Complete Tab ============
function AdminComplete() {
  const qc = useQueryClient();
  const [tournamentId, setTournamentId] = useState("");
  const [winnerIds, setWinnerIds] = useState<string[]>([]);
  const [prizeAmount, setPrizeAmount] = useState("");
  const [completing, setCompleting] = useState(false);

  const { data: tournamentsData } = useQuery({
    queryKey: ["admin-tournaments-complete"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tournaments", { cache: "no-store" });
      return res.json();
    },
  });

  const { data: regsData } = useQuery({
    queryKey: ["tournament-regs", tournamentId],
    queryFn: async () => {
      const res = await fetch(`/api/payments?status=approved`, { cache: "no-store" });
      return res.json();
    },
    enabled: !!tournamentId,
  });

  // Find selected tournament to determine type (1v1 vs 2v2)
  const selectedTournament = (tournamentsData?.tournaments ?? []).find((t: any) => t.id === tournamentId);
  const maxWinners = selectedTournament?.type === "2v2" ? 2 : 1;

  const toggleWinner = (uid: string) => {
    if (winnerIds.includes(uid)) {
      setWinnerIds(winnerIds.filter((id) => id !== uid));
    } else {
      if (winnerIds.length >= maxWinners) {
        toast.error(`Max ${maxWinners} winner${maxWinners > 1 ? "s" : ""} allowed for ${selectedTournament?.type}`);
        return;
      }
      setWinnerIds([...winnerIds, uid]);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentId || winnerIds.length === 0 || !prizeAmount) {
      toast.error("Fill all fields");
      return;
    }
    setCompleting(true);
    try {
      const res = await fetch("/api/admin/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId,
          winnerIds,
          prizeAmount: Number(prizeAmount),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const perShare = Math.floor(Number(prizeAmount) / winnerIds.length);
        toast.success(`Tournament completed! ${winnerIds.length} winner${winnerIds.length > 1 ? "s" : ""} credited ₹${perShare} each.`);
        setTournamentId("");
        setWinnerIds([]);
        setPrizeAmount("");
        qc.invalidateQueries({ queryKey: ["admin-tournaments-complete"] });
        qc.invalidateQueries({ queryKey: ["admin-stats"] });
        qc.invalidateQueries({ queryKey: ["leaderboard"] });
      } else {
        toast.error("Failed", { description: data.error });
      }
    } finally {
      setCompleting(false);
    }
  };

  const tournaments = (tournamentsData?.tournaments ?? []).filter(
    (t: any) => t.status === "active" || t.status === "started"
  );
  const approvedPlayers = (regsData?.payments ?? []).filter((p: any) => p.tournamentId === tournamentId);

  // Calculate per-winner share preview
  const perWinnerShare = winnerIds.length > 0 && prizeAmount
    ? Math.floor(Number(prizeAmount) / winnerIds.length)
    : 0;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white">Mark Tournament Completed</h3>
      <form onSubmit={handleComplete} className="glass-card rounded-lg p-4 space-y-3">
        <div>
          <Label className="text-xs">Tournament</Label>
          <Select value={tournamentId} onValueChange={(v) => { setTournamentId(v); setWinnerIds([]); }}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select tournament" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.title} ({t.type})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Winner selection — checkbox list (multi-select for 2v2) */}
        <div>
          <Label className="text-xs">
            Winner{maxWinners > 1 ? "s" : ""} ({winnerIds.length}/{maxWinners} selected)
          </Label>
          {!tournamentId ? (
            <div className="text-[10px] text-muted-foreground mt-1">Select tournament first</div>
          ) : approvedPlayers.length === 0 ? (
            <div className="text-[10px] text-yellow-400 mt-1">No approved players yet.</div>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar mt-1">
              {approvedPlayers.map((p: any) => {
                const isSelected = winnerIds.includes(p.userId);
                return (
                  <button
                    key={p.userId}
                    type="button"
                    onClick={() => toggleWinner(p.userId)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                      isSelected ? "bg-[#00ff9d]/15 border border-[#00ff9d]/40" : "glass-card border border-transparent"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "bg-[#00ff9d] border-[#00ff9d]" : "border-white/20"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white truncate">{p.userName}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{p.userEmail}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs">Total Prize Amount ₹</Label>
          <Input type="number" value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)} placeholder="e.g. 500" className="bg-white/5 border-white/10" required />
          {winnerIds.length > 0 && prizeAmount && (
            <div className="text-[10px] text-[#00ff9d] mt-1">
              Each winner gets: ₹{perWinnerShare.toLocaleString("en-IN")}
              {winnerIds.length > 1 && ` (${winnerIds.length} winners split equally)`}
            </div>
          )}
        </div>

        <Button type="submit" disabled={completing || winnerIds.length === 0} className="btn-glow-orange w-full rounded-full text-xs">
          {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
          Complete &amp; Award Prize
        </Button>
      </form>
    </div>
  );
}

// ============ Wallet Tab ============
function AdminWallet() {
  const qc = useQueryClient();
  const [subTab, setSubTab] = useState<"recharges" | "withdrawals" | "adjust">("recharges");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustAction, setAdjustAction] = useState<"add" | "subtract">("add");
  const [adjusting, setAdjusting] = useState(false);

  const { data: rechargeData, isLoading: rechargeLoading } = useQuery({
    queryKey: ["admin-recharges"],
    queryFn: async () => {
      const res = await fetch("/api/admin/recharges", { cache: "no-store" });
      return res.json();
    },
  });

  const { data: withdrawData, isLoading: withdrawLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const res = await fetch("/api/admin/withdrawals", { cache: "no-store" });
      return res.json();
    },
  });

  const handleRechargeAction = async (rechargeId: string, action: "approve" | "reject") => {
    setActionLoading(rechargeId + action);
    try {
      const res = await fetch("/api/admin/recharges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rechargeId, action }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Recharge ${action === "approve" ? "approved — wallet credited" : "rejected"}`);
        qc.invalidateQueries({ queryKey: ["admin-recharges"] });
      } else {
        toast.error("Failed", { description: data.error });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawAction = async (withdrawalId: string, action: "approve" | "reject") => {
    setActionLoading(withdrawalId + action);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Withdrawal ${action === "approve" ? "approved — wallet debited" : "rejected"}`);
        qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      } else {
        toast.error("Failed", { description: data.error });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(adjustAmount, 10);
    if (!adjustUserId || !amt || amt <= 0) {
      toast.error("Fill all fields");
      return;
    }
    setAdjusting(true);
    try {
      const res = await fetch("/api/admin/wallet/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adjustUserId,
          amount: amt,
          action: adjustAction,
          note: adjustNote || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Wallet ${adjustAction === "add" ? "credited" : "debited"} successfully`);
        setAdjustUserId("");
        setAdjustAmount("");
        setAdjustNote("");
      } else {
        toast.error("Failed", { description: data.error });
      }
    } finally {
      setAdjusting(false);
    }
  };

  const recharges = rechargeData?.recharges ?? [];
  const withdrawals = withdrawData?.withdrawals ?? [];
  const pendingRecharges = recharges.filter((r: any) => r.status === "pending");
  const pendingWithdrawals = withdrawals.filter((w: any) => w.status === "pending");

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white">Wallet Management</h3>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-full glass-card">
        <button
          onClick={() => setSubTab("recharges")}
          className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${subTab === "recharges" ? "btn-glow-green" : "text-muted-foreground"}`}
        >
          Recharges ({pendingRecharges.length})
        </button>
        <button
          onClick={() => setSubTab("withdrawals")}
          className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${subTab === "withdrawals" ? "btn-glow-green" : "text-muted-foreground"}`}
        >
          Withdrawals ({pendingWithdrawals.length})
        </button>
        <button
          onClick={() => setSubTab("adjust")}
          className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${subTab === "adjust" ? "btn-glow-green" : "text-muted-foreground"}`}
        >
          Adjust
        </button>
      </div>

      {/* Recharges */}
      {subTab === "recharges" && (
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
          {rechargeLoading ? (
            <div className="text-center py-4 text-xs text-muted-foreground">Loading...</div>
          ) : recharges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No recharge requests</div>
          ) : (
            recharges.map((r: any) => (
              <div key={r.id} className="glass-card rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#00ff9d]/20 flex items-center justify-center text-[#00ff9d] font-bold text-sm">
                      {r.userName?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{r.userName}</div>
                      <div className="text-[10px] text-muted-foreground">{r.userEmail}</div>
                      <div className="text-[10px] text-[#00ff9d]">Wallet: ₹{r.userWalletBalance}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[#00ff9d] flex items-center justify-end">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {r.amount}
                    </div>
                    <span className={`status-badge status-${r.status}`}>{r.status}</span>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mb-2 font-mono">UTR: {r.utrNumber}</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="glass-card rounded p-2">
                    <div className="text-[10px] text-muted-foreground mb-1">Screenshot</div>
                    {r.screenshotURL?.startsWith("http") ? (
                      <a href={r.screenshotURL} target="_blank" rel="noopener noreferrer">
                        <img src={r.screenshotURL} alt="Payment" className="w-full h-20 object-cover rounded" />
                      </a>
                    ) : (
                      <div className="w-full h-20 rounded bg-white/5 flex items-center justify-center text-[10px] text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="glass-card rounded p-2 text-[10px] text-muted-foreground">
                    Submitted: {new Date(r.submittedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {r.note && <div className="mt-1 italic">"{r.note}"</div>}
                  </div>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRechargeAction(r.id, "approve")}
                      disabled={actionLoading === r.id + "approve"}
                      className="btn-glow-green flex-1 rounded-full text-xs py-1.5 font-bold flex items-center justify-center gap-1"
                    >
                      {actionLoading === r.id + "approve" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Approve &amp; Credit
                    </button>
                    <button
                      onClick={() => handleRechargeAction(r.id, "reject")}
                      disabled={actionLoading === r.id + "reject"}
                      className="flex-1 rounded-full text-xs py-1.5 font-bold text-red-400 glass-card-hover"
                    >
                      {actionLoading === r.id + "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Withdrawals */}
      {subTab === "withdrawals" && (
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
          {withdrawLoading ? (
            <div className="text-center py-4 text-xs text-muted-foreground">Loading...</div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No withdrawal requests</div>
          ) : (
            withdrawals.map((w: any) => (
              <div key={w.id} className="glass-card rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#ff6b1a]/20 flex items-center justify-center text-[#ff6b1a] font-bold text-sm">
                      {r_safe_char(w.userName)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{w.userName}</div>
                      <div className="text-[10px] text-muted-foreground">{w.userEmail}</div>
                      <div className="text-[10px] text-[#00ff9d]">Wallet: ₹{w.userWalletBalance}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[#ff6b1a] flex items-center justify-end">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {w.amount}
                    </div>
                    <span className={`status-badge status-${w.status}`}>{w.status}</span>
                  </div>
                </div>
                <div className="glass-card rounded p-2 mb-2">
                  <div className="text-[10px] text-muted-foreground mb-0.5">Send payment to UPI:</div>
                  <div className="font-mono font-bold text-[#00ff9d] text-sm">{w.upiId}</div>
                  {w.note && <div className="text-[10px] text-muted-foreground mt-1 italic">"{w.note}"</div>}
                  {w.adminNote && <div className="text-[10px] text-yellow-400 mt-1">Admin: {w.adminNote}</div>}
                </div>
                <div className="text-[10px] text-muted-foreground mb-2">
                  Requested: {new Date(w.requestedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                {w.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleWithdrawAction(w.id, "approve")}
                      disabled={actionLoading === w.id + "approve"}
                      className="btn-glow-green flex-1 rounded-full text-xs py-1.5 font-bold flex items-center justify-center gap-1"
                    >
                      {actionLoading === w.id + "approve" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Approve (Mark Paid)
                    </button>
                    <button
                      onClick={() => handleWithdrawAction(w.id, "reject")}
                      disabled={actionLoading === w.id + "reject"}
                      className="flex-1 rounded-full text-xs py-1.5 font-bold text-red-400 glass-card-hover"
                    >
                      {actionLoading === w.id + "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Manual adjust */}
      {subTab === "adjust" && (
        <form onSubmit={handleAdjust} className="glass-card rounded-lg p-4 space-y-3">
          <div className="text-xs font-bold text-[#00ff9d] uppercase tracking-wider pb-2 border-b border-white/5">
            Manual Wallet Adjustment
          </div>
          <div className="text-[11px] text-muted-foreground -mt-2">
            Manually credit or debit any user's wallet. Useful for refunds, corrections, or bonuses.
          </div>
          <div>
            <Label className="text-xs">User UID</Label>
            <Input
              value={adjustUserId}
              onChange={(e) => setAdjustUserId(e.target.value)}
              placeholder="Paste user UID (from Firestore console)"
              className="bg-white/5 border-white/10 font-mono text-xs"
              required
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Find user UID in Firestore → users collection (document ID).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Action</Label>
              <Select value={adjustAction} onValueChange={(v: "add" | "subtract") => setAdjustAction(v)}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add (Credit)</SelectItem>
                  <SelectItem value="subtract">Subtract (Debit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Amount ₹</Label>
              <Input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="100"
                min={1}
                className="bg-white/5 border-white/10"
                required
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Note (optional)</Label>
            <Textarea
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              placeholder="Reason for adjustment..."
              className="bg-white/5 border-white/10 resize-none"
              rows={2}
            />
          </div>
          <Button type="submit" disabled={adjusting} className="btn-glow-green w-full rounded-full text-xs">
            {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            {adjustAction === "add" ? "Credit Wallet" : "Debit Wallet"}
          </Button>
        </form>
      )}
    </div>
  );
}

// Helper to safely get first char of username
function r_safe_char(name?: string): string {
  return (name ?? "?").charAt(0).toUpperCase();
}

// ============ Settings Tab ============
function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    upiId: "",
    payeeName: "",
    telegramUrl: "",
    instagramUrl: "",
    supportEmail: "",
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      return res.json();
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (data?.settings && !loaded) {
      setForm({
        upiId: data.settings.upiId || "",
        payeeName: data.settings.payeeName || "",
        telegramUrl: data.settings.telegramUrl || "",
        instagramUrl: data.settings.instagramUrl || "",
        supportEmail: data.settings.supportEmail || "",
      });
      setLoaded(true);
    }
  }, [data, loaded]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Settings saved successfully");
        qc.invalidateQueries({ queryKey: ["admin-settings"] });
        qc.invalidateQueries({ queryKey: ["settings"] }); // public settings
      } else {
        toast.error("Failed", { description: data.error });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white">App Settings</h3>
      <p className="text-[11px] text-muted-foreground -mt-2">
        Customize payment details and support links. Changes apply instantly to all users.
      </p>

      <form onSubmit={handleSave} className="glass-card rounded-lg p-4 space-y-3">
        <div className="text-xs font-bold text-[#00ff9d] uppercase tracking-wider pb-2 border-b border-white/5">
          💳 Payment Settings
        </div>
        <div>
          <Label className="text-xs">UPI ID <span className="text-[#ff6b1a]">*</span></Label>
          <Input
            value={form.upiId}
            onChange={(e) => setForm({ ...form, upiId: e.target.value })}
            placeholder="yourname@upi"
            className="bg-white/5 border-white/10 font-mono"
            required
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            This UPI ID will be shown in the payment modal QR code section.
          </p>
        </div>
        <div>
          <Label className="text-xs">Payee Name <span className="text-[#ff6b1a]">*</span></Label>
          <Input
            value={form.payeeName}
            onChange={(e) => setForm({ ...form, payeeName: e.target.value })}
            placeholder="FF Tournament"
            className="bg-white/5 border-white/10"
            required
          />
        </div>

        <div className="text-xs font-bold text-[#00ff9d] uppercase tracking-wider pt-2 pb-2 border-b border-white/5">
          🔗 Support Links
        </div>
        <div>
          <Label className="text-xs">Telegram URL</Label>
          <Input
            value={form.telegramUrl}
            onChange={(e) => setForm({ ...form, telegramUrl: e.target.value })}
            placeholder="https://t.me/yourchannel"
            className="bg-white/5 border-white/10"
          />
        </div>
        <div>
          <Label className="text-xs">Instagram URL</Label>
          <Input
            value={form.instagramUrl}
            onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
            placeholder="https://instagram.com/yourhandle"
            className="bg-white/5 border-white/10"
          />
        </div>
        <div>
          <Label className="text-xs">Support Email</Label>
          <Input
            type="email"
            value={form.supportEmail}
            onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
            placeholder="support@yourdomain.com"
            className="bg-white/5 border-white/10"
          />
        </div>

        <Button type="submit" disabled={saving} className="btn-glow-green w-full rounded-full text-xs">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Settings
        </Button>
      </form>

      <div className="glass-card rounded-lg p-3 border-yellow-500/20 bg-yellow-500/5">
        <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-1">⚠️ Important</div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Make sure the UPI ID is correct and registered to receive payments.
          Test by making a small ₹1 payment before going live with real tournaments.
        </p>
      </div>
    </div>
  );
}

// ============ Chat Tab ============
function AdminChat() {
  const qc = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all chats (poll every 5s)
  const { data: chatListData } = useQuery({
    queryKey: ["admin-chat-list"],
    queryFn: async () => {
      const res = await fetch("/api/admin/chat", { cache: "no-store" });
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Fetch messages for selected chat (poll every 3s)
  const { data: chatMsgData } = useQuery({
    queryKey: ["admin-chat-messages", selectedChatId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/chat?chatId=${selectedChatId}`, { cache: "no-store" });
      return res.json();
    },
    enabled: !!selectedChatId,
    refetchInterval: selectedChatId ? 3000 : false,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result.ok) { setPendingImage(result.url); toast.success("Image attached"); }
      else throw new Error(result.error || "Upload failed");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleSend = async () => {
    if (!selectedChatId || (!replyText.trim() && !pendingImage)) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedChatId, text: replyText.trim() || null, imageUrl: pendingImage }),
      });
      const data = await res.json();
      if (data.ok) {
        setReplyText("");
        setPendingImage(null);
        qc.invalidateQueries({ queryKey: ["admin-chat-messages", selectedChatId] });
        qc.invalidateQueries({ queryKey: ["admin-chat-list"] });
      } else { toast.error("Send failed", { description: data.error }); }
    } catch { toast.error("Network error"); }
    finally { setSending(false); }
  };

  const chats = chatListData?.chats ?? [];
  const messages = chatMsgData?.messages ?? [];
  const selectedChat = chatMsgData?.chat;
  const totalUnread = chats.reduce((sum: number, c: any) => sum + (c.unreadByAdmin || 0), 0);

  // ===== Conversation Detail View =====
  if (selectedChatId && selectedChat) {
    return (
      <div className="space-y-3 flex flex-col" style={{ minHeight: "400px" }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectedChatId(null); setReplyText(""); setPendingImage(null); }}
            className="px-3 py-1.5 rounded-full glass-card text-xs font-bold text-muted-foreground hover:text-white"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00ff9d]/20 flex items-center justify-center text-[#00ff9d] font-bold text-sm">
              {selectedChat.userName?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <div className="font-bold text-white text-sm">{selectedChat.userName}</div>
              <div className="text-[10px] text-muted-foreground">{selectedChat.userEmail}</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-64 min-h-48 p-2">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No messages yet</div>
          ) : (
            messages.map((msg: any) => {
              const isAdmin = msg.senderRole === "admin";
              return (
                <div key={msg.id} className={`flex gap-2 ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl p-2.5 ${
                    isAdmin ? "bg-[#00ff9d]/15 border border-[#00ff9d]/30 rounded-br-sm" : "bg-white/5 border border-white/10 rounded-bl-sm"
                  }`}>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Shared" className="w-full rounded-lg mb-1.5 max-h-32 object-cover" onClick={() => window.open(msg.imageUrl, "_blank")} />
                    )}
                    {msg.text && <p className="text-xs text-white leading-relaxed break-words">{msg.text}</p>}
                    <div className={`text-[8px] mt-0.5 ${isAdmin ? "text-[#00ff9d]/50" : "text-muted-foreground/50"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pending image preview */}
        {pendingImage && (
          <div className="flex items-center gap-2 px-2">
            <div className="relative">
              <img src={pendingImage} alt="Pending" className="h-12 rounded" />
              <button onClick={() => setPendingImage(null)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center">✕</button>
            </div>
          </div>
        )}

        {/* Reply input */}
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading || sending} className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-[#00ff9d] flex-shrink-0">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          </button>
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
            placeholder="Reply..."
            disabled={sending}
            className="flex-1 bg-white/5 border border-white/10 focus:border-[#00ff9d] rounded-full px-3 py-1.5 text-xs text-white outline-none"
          />
          <button onClick={handleSend} disabled={sending || (!replyText.trim() && !pendingImage)} className="w-8 h-8 rounded-full btn-glow-green flex items-center justify-center flex-shrink-0 disabled:opacity-50">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // ===== Chat List View =====
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
      <h3 className="text-sm font-bold text-white">
        Player Messages {totalUnread > 0 && <span className="text-[#ff6b1a]">({totalUnread} unread)</span>}
      </h3>
      {chats.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No conversations yet</div>
      ) : (
        chats.map((c: any) => (
          <button
            key={c.id}
            onClick={() => setSelectedChatId(c.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg glass-card hover:border-[#00ff9d]/30 text-left transition-colors ${c.unreadByAdmin > 0 ? "border-l-2 border-l-[#ff6b1a]" : ""}`}
          >
            <div className="w-10 h-10 rounded-full bg-[#00ff9d]/20 flex items-center justify-center text-[#00ff9d] font-bold flex-shrink-0">
              {c.userName?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm truncate">{c.userName}</span>
                {c.lastMessageAt && (
                  <span className="text-[9px] text-muted-foreground flex-shrink-0 ml-2">
                    {new Date(c.lastMessageAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[11px] text-muted-foreground truncate">
                  {c.lastSender === "admin" && "You: "}{c.lastMessage || "No messages"}
                </span>
                {c.unreadByAdmin > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#ff6b1a] text-white text-[9px] font-bold flex-shrink-0">
                    {c.unreadByAdmin}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ============ Main Admin Modal ============
export function AdminModal() {
  const { activeModal, closeModal } = useUI();
  const isOpen = activeModal === "admin";

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="sm:max-w-2xl bg-[#0c0c12] border-white/10 p-0 overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar">
        <DialogTitle className="sr-only">Admin Panel</DialogTitle>
        <DialogDescription className="sr-only">Manage tournaments, payments, rooms, and winners.</DialogDescription>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#ff6b1a]/15 via-[#0c0c12] to-[#00ff9d]/15 p-5 border-b border-white/5">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 w-8 h-8 rounded-full glass-card flex items-center justify-center text-white hover:bg-white/10 z-10"
          >
            ✕
          </button>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b1a] to-[#00ff9d] flex items-center justify-center glow-orange">
              <Shield className="w-6 h-6 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">Manage tournaments, payments, rooms &amp; winners</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-transparent p-0 h-auto mb-4">
              <TabsTrigger value="stats" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                <Shield className="w-4 h-4" /> Stats
              </TabsTrigger>
              <TabsTrigger value="tournaments" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                <Trophy className="w-4 h-4" /> Tournaments
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                <Wallet className="w-4 h-4" /> Wallet
              </TabsTrigger>
              <TabsTrigger value="rooms" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                <Key className="w-4 h-4" /> Rooms
              </TabsTrigger>
              <TabsTrigger value="complete" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                <Crown className="w-4 h-4" /> Complete
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                <Settings className="w-4 h-4" /> Settings
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                <MessageCircle className="w-4 h-4" /> Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="mt-0"><AdminStats /></TabsContent>
            <TabsContent value="tournaments" className="mt-0"><AdminTournaments /></TabsContent>
            <TabsContent value="wallet" className="mt-0"><AdminWallet /></TabsContent>
            <TabsContent value="rooms" className="mt-0"><AdminRooms /></TabsContent>
            <TabsContent value="complete" className="mt-0"><AdminComplete /></TabsContent>
            <TabsContent value="settings" className="mt-0"><AdminSettings /></TabsContent>
            <TabsContent value="chat" className="mt-0"><AdminChat /></TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
