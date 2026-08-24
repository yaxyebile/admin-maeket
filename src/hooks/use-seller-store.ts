"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Store } from "@/lib/types";
import { useAuth } from "@/context/auth-context";

export function useSellerStore() {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setStore(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();
    setStore(data as Store | null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { store, loading, refresh };
}
