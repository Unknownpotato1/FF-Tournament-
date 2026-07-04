"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase-client";

export type AppUser = {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: "user" | "admin";
  registeredAt: string;
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from server on mount
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser: FirebaseUser = result.user;
      // Get ID token and exchange for session cookie
      const idToken = await fbUser.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (data.ok) {
        setUser(data.user);
        return { ok: true };
      }
      return { ok: false, error: data.error };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      return { ok: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Sign out from Firebase client
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
    } catch {
      // ignore if not signed in client-side
    }
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
