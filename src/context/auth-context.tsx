"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<Profile | null>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "current_user";
const USER_ID_KEY = "current_user_id";

// Fallback demo accounts
const DEMO_ACCOUNTS: Profile[] = [
  {
    id: "demo-restaurant-id",
    name: "Restaurant Manager",
    email: "restaurant@market.com",
    password: "restaurant123",
    role: "restaurant",
    store_id: "demo-restaurant-store",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-admin-id",
    name: "System Admin",
    email: "admin@market.com",
    password: "admin123",
    role: "admin",
    created_at: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored) as Profile);
      } catch {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(USER_ID_KEY);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    setLoading(false);
  }, [refreshUser]);

  const login = useCallback(
    async (loginValue: string, password: string): Promise<Profile | null> => {
      let found: Profile | undefined;

      try {
        const { data } = await supabase.from("profiles").select("*");
        if (data) {
          found = (data as Profile[]).find(
            (p: Profile) =>
              (p.email?.toLowerCase() === loginValue.toLowerCase() || p.phone === loginValue) &&
              p.password === password
          );
        }
      } catch {
        console.warn("Supabase query error, checking fallback demo accounts");
      }

      // Check fallback demo accounts if not found in database
      if (!found) {
        found = DEMO_ACCOUNTS.find(
          (d) =>
            (d.email.toLowerCase() === loginValue.toLowerCase() || d.phone === loginValue) &&
            d.password === password
        );
      }

      if (!found) return null;

      localStorage.setItem(USER_KEY, JSON.stringify(found));
      localStorage.setItem(USER_ID_KEY, found.id);
      setUser(found as Profile);
      return found as Profile;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_ID_KEY);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
