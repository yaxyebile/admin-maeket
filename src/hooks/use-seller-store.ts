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

    try {
      let myStore: Store | null = null;

      // 1. Primary check: Store explicitly assigned to user's profile store_id
      if (user.store_id) {
        const { data: profileStore } = await supabase
          .from("stores")
          .select("*")
          .eq("id", user.store_id)
          .maybeSingle();
        if (profileStore) {
          myStore = profileStore as Store;
        }
      }

      // 2. Secondary check: Store owned by user.id
      if (!myStore) {
        const { data: ownerStore } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();
        if (ownerStore) {
          myStore = ownerStore as Store;
        }
      }

      // 3. Fallback: Only if user has no linked store, select first store for demo view
      if (!myStore) {
        const { data: fallbackStores } = await supabase.from("stores").select("*").limit(1);
        if (fallbackStores && fallbackStores.length > 0) {
          myStore = fallbackStores[0] as Store;
        }
      }

      setStore(myStore);
    } catch (err) {
      console.error("Failed to fetch store:", err);
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.store_id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { store, loading, refresh };
}
