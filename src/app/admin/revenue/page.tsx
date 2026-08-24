"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { revenueByStoreFromOrders } from "@/lib/order-split";
import type { Order, Store } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/loading-skeleton";

interface StoreRevenueRow {
  store: Store;
  revenue: number;
  orderCount: number;
}

export default function AdminRevenuePage() {
  const [rows, setRows] = useState<StoreRevenueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [storesRes, ordersRes] = await Promise.all([
      supabase.from("stores").select("*").order("name"),
      supabase.from("orders").select("*").eq("is_paid", true),
    ]);
    const stores = (storesRes.data as Store[]) ?? [];
    const orders = (ordersRes.data as Order[]) ?? [];

    const byStore = revenueByStoreFromOrders(orders);

    setRows(
      stores.map((store) => ({
        store,
        revenue: byStore[store.id]?.revenue ?? 0,
        orderCount: byStore[store.id]?.count ?? 0,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = rows.reduce((s, r) => s + r.revenue, 0);

  return (
    <div>
      <PageHeader
        title="Store Revenue"
        description={`Total paid revenue: ${formatCurrency(total)}`}
      />
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="space-y-3">
          {rows
            .sort((a, b) => b.revenue - a.revenue)
            .map(({ store, revenue, orderCount }) => (
              <Card key={store.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    {store.logo && (
                      <img
                        src={store.logo}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{store.name}</p>
                      <p className="text-xs text-slate-500">
                        {orderCount} paid orders
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(revenue)}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
