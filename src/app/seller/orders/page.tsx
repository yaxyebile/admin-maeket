"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { filterOrdersForStore } from "@/lib/order-split";
import type { Order } from "@/lib/types";
import { useSellerStore } from "@/hooks/use-seller-store";
import { PageHeader } from "@/components/page-header";
import { OrderCard } from "@/components/order-card";
import { TableSkeleton } from "@/components/loading-skeleton";

export default function SellerOrdersPage() {
  const { store, loading: storeLoading } = useSellerStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!store) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("status", [
        "paymentConfirmed",
        "approved",
        "outForDelivery",
        "delivered",
      ])
      .order("date", { ascending: false })
      .limit(150);

    const all = (data as Order[]) ?? [];
    setOrders(filterOrdersForStore(all, store.id));
    setLoading(false);
  }, [store]);

  useEffect(() => {
    if (!storeLoading) load();
  }, [load, storeLoading]);

  if (!storeLoading && !store) {
    return (
      <p className="text-slate-500">Contact admin to set up your store.</p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Qaybta dukaankaaga — hal dalab wadajir ah (dukaamo badan)"
      />
      {loading ? (
        <TableSkeleton />
      ) : orders.length === 0 ? (
        <p className="text-slate-500">No orders yet</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              sellerStoreId={store!.id}
              readOnly
            />
          ))}
        </div>
      )}
    </div>
  );
}
