"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type AppUser = {
  id: string;
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
  loginWithEmail: (email: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

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
    const res = await fetch("/api/auth/google", { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error };
  }, []);

  const loginWithEmail = useCallback(async (email: string, name: string) => {
    const res = await fetch("/api/auth/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    const data = await res.json();
    if (data.ok) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithGoogle, loginWithEmail, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
