import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { sendPushNotification } from "@/lib/push";

const toIso = (v: unknown): string => {
  if (v instanceof Date) return v.toISOString();
  if (v && typeof v === "object" && "_seconds" in v) return new Date((v as { _seconds: number })._seconds * 1000).toISOString();
  return new Date().toISOString();
};

// GET /api/admin/chat — list all chats (admin view) or get specific chat messages
// ?chatId=xxx → returns messages for specific chat
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const db = getAdminDb();
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (chatId) {
      // Fetch specific chat's messages
      const chatRef = db.collection("chats").doc(chatId);
      const chatSnap = await chatRef.get();
      if (!chatSnap.exists) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      const chat = chatSnap.data()!;

      const msgSnap = await chatRef.collection("messages").orderBy("createdAt", "asc").limit(100).get();
      const messages = msgSnap.docs.map((doc) => {
        const m = doc.data();
        return {
          id: doc.id,
          senderId: m.senderId,
          senderRole: m.senderRole,
          text: m.text || "",
          imageUrl: m.imageUrl || null,
          createdAt: toIso(m.createdAt),
        };
      });

      // Mark as read by admin
      if (chat.unreadByAdmin > 0) {
        await chatRef.update({ unreadByAdmin: 0 });
      }

      return NextResponse.json({
        ok: true,
        chat: {
          id: chatRef.id,
          userId: chat.userId,
          userName: chat.userName,
          userEmail: chat.userEmail,
          userPhoto: chat.userPhoto,
          unreadByAdmin: 0,
        },
        messages,
      });
    }

    // List all chats (sorted by lastMessageAt desc)
    const snap = await db.collection("chats").limit(200).get();
    const chats = snap.docs
      .map((doc) => {
        const c = doc.data();
        return {
          id: doc.id,
          userId: c.userId,
          userName: c.userName || "Unknown",
          userEmail: c.userEmail || "",
          userPhoto: c.userPhoto || null,
          lastMessage: c.lastMessage || "",
          lastMessageAt: c.lastMessageAt ? toIso(c.lastMessageAt) : null,
          lastSender: c.lastSender || null,
          unreadByAdmin: c.unreadByAdmin || 0,
          ms: c.lastMessageAt ? (c.lastMessageAt instanceof Date ? c.lastMessageAt.getTime() : c.lastMessageAt?._seconds ? c.lastMessageAt._seconds * 1000 : 0) : 0,
        };
      })
      .sort((a, b) => b.ms - a.ms);

    return NextResponse.json({ ok: true, chats });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// POST /api/admin/chat — admin replies to a user's chat
// Body: { chatId, text?, imageUrl? }
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { chatId, text, imageUrl } = await req.json();
    if (!chatId || (!text && !imageUrl)) {
      return NextResponse.json({ ok: false, error: "chatId + message required" }, { status: 400 });
    }

    const db = getAdminDb();
    const chatRef = db.collection("chats").doc(chatId);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) return NextResponse.json({ ok: false, error: "Chat not found" }, { status: 404 });
    const chat = chatSnap.data()!;

    // Add message
    const msgRef = await chatRef.collection("messages").add({
      senderId: "admin",
      senderRole: "admin",
      text: text || "",
      imageUrl: imageUrl || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update chat metadata
    await chatRef.update({
      lastMessage: text ? text.slice(0, 100) : "📷 Image",
      lastMessageAt: FieldValue.serverTimestamp(),
      lastSender: "admin",
      unreadByUser: FieldValue.increment(1),
    });

    // Send push notification to user
    await sendPushNotification(chat.userId, {
      title: "💬 Admin Replied",
      body: text ? text.slice(0, 100) : "Admin sent you an image. Tap to view.",
      tag: "chat",
      data: { url: "/" },
    });

    return NextResponse.json({ ok: true, messageId: msgRef.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "UNAUTHORIZED" || msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
