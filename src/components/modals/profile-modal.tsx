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
import { Button } from "@/components/ui/button";
import {
  Shield,
  LogOut,
  Pencil,
  Loader2,
  Upload,
  Check,
  X,
  Wallet,
  Mail,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

async function fetchDashboard() {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  return res.json();
}

export function ProfileModal() {
  const { activeModal, closeModal, openModal } = useUI();
  const { user, logout, refresh } = useAuth();
  const qc = useQueryClient();
  const isOpen = activeModal === "profile";

  const { data, isLoading } = useQuery({
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
    if (user) {
      setEditName(user.name);
      setEditPhotoURL(user.photoURL);
      setEditPhotoPreview(user.photoURL);
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
    setEditPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      // Safe JSON parse — server might return HTML error page
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Server error (HTTP ${res.status}). Please try again or contact support.`);
      }
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
      setEditPhotoPreview(user?.photoURL ?? null);
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
        body: JSON.stringify({ name: editName.trim(), photoURL: editPhotoURL }),
      });
      const result = await res.json();
      if (result.ok) {
        toast.success("Profile updated!");
        setEditing(false);
        await refresh();
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

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="sm:max-w-md bg-[#0c0c12] border-white/10 p-0 overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar">
        <DialogTitle className="sr-only">Profile</DialogTitle>
        <DialogDescription className="sr-only">View and edit your profile information.</DialogDescription>

        {/* Header banner */}
        <div className="relative bg-gradient-to-br from-[#00ff9d]/20 via-[#0c0c12] to-[#ff6b1a]/20 p-5 border-b border-white/5">
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff9d]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff6b1a]/20 rounded-full blur-3xl" />
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 w-8 h-8 rounded-full glass-card flex items-center justify-center text-white hover:bg-white/10 z-10"
          >
            ✕
          </button>

          <div className="relative">
            {isLoading || !user ? (
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : editing ? (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-2 border-[#00ff9d]/60">
                      <AvatarImage src={editPhotoPreview ?? undefined} alt="Profile" />
                      <AvatarFallback className="bg-[#00ff9d]/20 text-[#00ff9d] text-3xl font-black">
                        {(editName || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#00ff9d] text-black flex items-center justify-center hover:glow-green disabled:opacity-50"
                      aria-label="Change photo"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="w-full">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Display Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={40}
                      placeholder="Your name"
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#00ff9d] text-white text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile || uploadingPhoto}
                      className="btn-glow-green rounded-full px-5 py-2 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
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
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-2 py-2">
                <Avatar className="w-20 h-20 border-2 border-[#00ff9d]/40">
                  <AvatarImage src={user.photoURL ?? undefined} alt={user.name} />
                  <AvatarFallback className="bg-[#00ff9d]/20 text-[#00ff9d] text-3xl font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">{user.name}</h2>
                  {user.role === "admin" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ff6b1a]/20 text-[#ff6b1a] border border-[#ff6b1a]/40 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> ADMIN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  Joined {new Date(user.registeredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          {/* Wallet balance card */}
          {user && (
            <div className="glass-card rounded-xl p-4 bg-gradient-to-br from-[#00ff9d]/8 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-[#00ff9d]" /> Wallet Balance
                  </div>
                  <div className="text-3xl font-black text-[#00ff9d] mt-0.5">
                    ₹{(user.walletBalance ?? 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => openModal("recharge")}
                  className="btn-glow-green rounded-full py-2 text-xs font-bold"
                >
                  + Recharge
                </button>
                <button
                  onClick={() => openModal("withdraw")}
                  className="btn-ghost-glow rounded-full py-2 text-xs font-bold"
                >
                  Withdraw
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!editing && user && (
            <>
              <button
                onClick={handleEditStart}
                className="w-full flex items-center justify-between p-3 rounded-lg glass-card glass-card-hover text-sm"
              >
                <span className="flex items-center gap-2 text-white">
                  <Pencil className="w-4 h-4 text-[#00ff9d]" /> Edit Profile
                </span>
                <span className="text-muted-foreground">→</span>
              </button>

              <button
                onClick={() => { closeModal(); openModal("dashboard"); }}
                className="w-full flex items-center justify-between p-3 rounded-lg glass-card glass-card-hover text-sm"
              >
                <span className="flex items-center gap-2 text-white">
                  📊 My Dashboard
                </span>
                <span className="text-muted-foreground">→</span>
              </button>

              <button
                onClick={() => { closeModal(); openModal("chat"); }}
                className="w-full flex items-center justify-between p-3 rounded-lg glass-card glass-card-hover text-sm"
              >
                <span className="flex items-center gap-2 text-white">
                  💬 Talk to Admin
                </span>
                <span className="text-muted-foreground">→</span>
              </button>

              {user.role === "admin" && (
                <button
                  onClick={() => { closeModal(); openModal("admin"); }}
                  className="w-full flex items-center justify-between p-3 rounded-lg glass-card glass-card-hover text-sm"
                >
                  <span className="flex items-center gap-2 text-[#ff6b1a]">
                    <Shield className="w-4 h-4" /> Admin Panel
                  </span>
                  <span className="text-muted-foreground">→</span>
                </button>
              )}

              <button
                onClick={() => { logout(); closeModal(); }}
                className="w-full flex items-center justify-between p-3 rounded-lg glass-card hover:bg-red-500/10 text-sm"
              >
                <span className="flex items-center gap-2 text-red-400">
                  <LogOut className="w-4 h-4" /> Logout
                </span>
                <span className="text-muted-foreground">→</span>
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
