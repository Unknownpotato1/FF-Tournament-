"use client";

import { useState, useEffect } from "react";
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
  const [winnerId, setWinnerId] = useState("");
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
      // Fetch approved registrations for the selected tournament
      const res = await fetch(`/api/payments?status=approved`, { cache: "no-store" });
      return res.json();
    },
    enabled: !!tournamentId,
  });

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentId || !winnerId || !prizeAmount) {
      toast.error("Fill all fields");
      return;
    }
    setCompleting(true);
    try {
      const res = await fetch("/api/admin/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId, winnerId, prizeAmount: Number(prizeAmount) }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Tournament completed! Winner credited.");
        setTournamentId("");
        setWinnerId("");
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

  // Complete tab: admin can mark any active OR started tournament as completed
  const tournaments = (tournamentsData?.tournaments ?? []).filter(
    (t: any) => t.status === "active" || t.status === "started"
  );
  const approvedPayments = (regsData?.payments ?? []).filter((p: any) => p.tournamentId === tournamentId);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white">Mark Tournament Completed</h3>
      <form onSubmit={handleComplete} className="glass-card rounded-lg p-4 space-y-3">
        <div>
          <Label className="text-xs">Tournament</Label>
          <Select value={tournamentId} onValueChange={(v) => { setTournamentId(v); setWinnerId(""); }}>
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
        <div>
          <Label className="text-xs">Winner</Label>
          <Select value={winnerId} onValueChange={setWinnerId} disabled={!tournamentId}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder={tournamentId ? "Select winner" : "Select tournament first"} />
            </SelectTrigger>
            <SelectContent>
              {approvedPayments.map((p: any) => (
                <SelectItem key={p.userId} value={p.userId}>{p.userName} ({p.userEmail})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tournamentId && approvedPayments.length === 0 && (
            <div className="text-[10px] text-yellow-400 mt-1">No approved players yet.</div>
          )}
        </div>
        <div>
          <Label className="text-xs">Prize Amount ₹</Label>
          <Input type="number" value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)} placeholder="e.g. 500" className="bg-white/5 border-white/10" required />
        </div>
        <Button type="submit" disabled={completing} className="btn-glow-orange w-full rounded-full text-xs">
          {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
          Complete &amp; Award Prize
        </Button>
      </form>
    </div>
  );
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
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-transparent p-0 h-auto mb-4">
              <TabsTrigger value="stats" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                <Shield className="w-4 h-4" /> Stats
              </TabsTrigger>
              <TabsTrigger value="tournaments" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                <Trophy className="w-4 h-4" /> Tournaments
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex flex-col gap-1 py-2 text-[10px] data-[state=active]:bg-[#00ff9d]/10 data-[state=active]:text-[#00ff9d]">
                <CreditCard className="w-4 h-4" /> Payments
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
            </TabsList>

            <TabsContent value="stats" className="mt-0"><AdminStats /></TabsContent>
            <TabsContent value="tournaments" className="mt-0"><AdminTournaments /></TabsContent>
            <TabsContent value="payments" className="mt-0"><AdminPayments /></TabsContent>
            <TabsContent value="rooms" className="mt-0"><AdminRooms /></TabsContent>
            <TabsContent value="complete" className="mt-0"><AdminComplete /></TabsContent>
            <TabsContent value="settings" className="mt-0"><AdminSettings /></TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
