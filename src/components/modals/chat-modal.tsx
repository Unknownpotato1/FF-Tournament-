"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  X,
  Image as ImageIcon,
  Loader2,
  Shield,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

type Message = {
  id: string;
  senderId: string;
  senderRole: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
};

type ChatData = {
  ok: boolean;
  chat: { id: string; userName: string; unreadByUser: number; lastMessage: string; lastMessageAt: string | null };
  messages: Message[];
};

async function fetchChat(): Promise<ChatData> {
  const res = await fetch("/api/chat", { cache: "no-store" });
  return res.json();
}

export function ChatModal() {
  const { activeModal, closeModal } = useUI();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isOpen = activeModal === "chat";

  const { data, refetch } = useQuery({
    queryKey: ["chat"],
    queryFn: fetchChat,
    enabled: isOpen && !!user,
    refetchInterval: isOpen ? 5000 : false, // Poll every 5 seconds when open
  });

  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", { description: "Max 2MB" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only images allowed");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "payment"); // reuse screenshot upload (same folder structure)
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Upload failed. Please try again.");
      }
      const result = await res.json();
      if (result.ok) {
        setPendingImage(result.url);
        toast.success("Image attached");
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (err) {
      toast.error("Upload failed", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !pendingImage) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim() || null,
          imageUrl: pendingImage,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setText("");
        setPendingImage(null);
        refetch();
      } else {
        toast.error("Send failed", { description: data.error });
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  };

  const messages = data?.messages ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="sm:max-w-md bg-[#0c0c12] border-white/10 p-0 overflow-hidden max-h-[92vh] flex flex-col">
        <DialogTitle className="sr-only">Talk to Admin</DialogTitle>
        <DialogDescription className="sr-only">Chat with the tournament admin.</DialogDescription>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#00ff9d]/15 via-[#0c0c12] to-[#ff6b1a]/15 p-4 border-b border-white/5 flex-shrink-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 w-8 h-8 rounded-full glass-card flex items-center justify-center text-white hover:bg-white/10 z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00ff9d] to-[#ff6b1a] flex items-center justify-center glow-green">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="font-black text-white text-base">Talk to Admin</div>
              <div className="text-[10px] text-[#00ff9d] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" /> Online
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 min-h-[300px] max-h-[400px]">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">Send a message to start chatting with admin</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.senderRole === "user";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00ff9d] to-[#ff6b1a] flex items-center justify-center flex-shrink-0">
                      <Shield className="w-3.5 h-3.5 text-black" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl p-3 ${
                    isUser
                      ? "bg-[#00ff9d]/15 border border-[#00ff9d]/30 rounded-br-sm"
                      : "bg-white/5 border border-white/10 rounded-bl-sm"
                  }`}>
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Shared image"
                        className="w-full rounded-lg mb-2 max-h-48 object-cover cursor-pointer"
                        onClick={() => window.open(msg.imageUrl!, "_blank")}
                      />
                    )}
                    {msg.text && (
                      <p className="text-sm text-white leading-relaxed break-words">{msg.text}</p>
                    )}
                    <div className={`text-[9px] mt-1 ${isUser ? "text-[#00ff9d]/50" : "text-muted-foreground/50"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Pending image preview */}
        {pendingImage && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="relative inline-block">
              <img src={pendingImage} alt="Pending" className="h-16 rounded-lg" />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-white/5 flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || sending}
              className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-[#00ff9d] flex-shrink-0"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 bg-white/5 border border-white/10 focus:border-[#00ff9d] rounded-full px-4 py-2 text-sm text-white outline-none"
            />
            <button
              onClick={handleSend}
              disabled={sending || (!text.trim() && !pendingImage)}
              className="w-9 h-9 rounded-full btn-glow-green flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
