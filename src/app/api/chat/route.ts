import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

const toIso = (v: unknown): string => {
  if (v instanceof Date) return v.toISOString();
  if (v && typeof v === "object" && "_seconds" in v) return new Date((v as { _seconds: number })._seconds * 1000).toISOString();
  return new Date().toISOString();
};

// GET /api/chat — get user's chat with admin (messages + unread count)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const db = getAdminDb();
    // Find or create the user's chat document
    let chatRef = db.collection("chats").doc(user.uid);
    let chatSnap = await chatRef.get();

    if (!chatSnap.exists) {
      await chatRef.set({
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        userPhoto: user.photoURL,
        lastMessage: "",
        lastMessageAt: FieldValue.serverTimestamp(),
        lastSender: null,
        unreadByUser: 0,
        unreadByAdmin: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
      chatSnap = await chatRef.get();
    }

    const chat = chatSnap.data()!;

    // Fetch messages (subcollection)
    const msgSnap = await chatRef
      .collection("messages")
      .orderBy("createdAt", "asc")
      .limit(100)
      .get();

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

    // Mark admin messages as read by user
    if (chat.unreadByUser > 0) {
      await chatRef.update({ unreadByUser: 0 });
    }

    return NextResponse.json({
      ok: true,
      chat: {
        id: chatRef.id,
        userName: chat.userName,
        unreadByUser: chat.unreadByUser || 0,
        lastMessage: chat.lastMessage || "",
        lastMessageAt: chat.lastMessageAt ? toIso(chat.lastMessageAt) : null,
      },
      messages,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// POST /api/chat — send a message to admin
// Body: { text?: string, imageUrl?: string }
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { text, imageUrl } = await req.json();
    if (!text && !imageUrl) {
      return NextResponse.json({ ok: false, error: "Message text or image required" }, { status: 400 });
    }

    const db = getAdminDb();
    const chatRef = db.collection("chats").doc(user.uid);

    // Ensure chat exists
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) {
      await chatRef.set({
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        userPhoto: user.photoURL,
        lastMessage: "",
        lastMessageAt: FieldValue.serverTimestamp(),
        lastSender: null,
        unreadByUser: 0,
        unreadByAdmin: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // Add message to subcollection
    const msgRef = await chatRef.collection("messages").add({
      senderId: user.uid,
      senderRole: "user",
      text: text || "",
      imageUrl: imageUrl || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update chat metadata
    await chatRef.update({
      lastMessage: text ? text.slice(0, 100) : "📷 Image",
      lastMessageAt: FieldValue.serverTimestamp(),
      lastSender: "user",
      unreadByAdmin: FieldValue.increment(1),
      userName: user.name,
      userPhoto: user.photoURL,
    });

    return NextResponse.json({ ok: true, messageId: msgRef.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
