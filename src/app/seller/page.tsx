"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, Package, Clock, ShoppingBag, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Order, Product } from "@/lib/types";
import {
  filterOrdersForStore,
  storeSubtotalInOrder,
} from "@/lib/order-split";
import { useSellerStore } from "@/hooks/use-seller-store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderCard } from "@/components/order-card";
import { CardGridSkeleton } from "@/components/loading-skeleton";
import { Store } from "lucide-react";

export default function SellerDashboardPage() {
  const { store, loading: storeLoading } = useSellerStore();
  const [revenue, setRevenue] = useState(0);
  const [approvedProducts, setApprovedProducts] = useState(0);
  const [pendingProducts, setPendingProducts] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!store) {
      setLoading(false);
      return;
    }
    const [ordersRes, productsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .in("status", [
          "paymentConfirmed",
          "approved",
          "outForDelivery",
          "delivered",
        ])
        .limit(150),
      supabase.from("products").select("*").eq("store_id", store.id),
    ]);
    const orders = filterOrdersForStore(
      (ordersRes.data as Order[]) ?? [],
      store.id
    );
    const products = (productsRes.data as Product[]) ?? [];
    const paid = orders.filter((o) => o.is_paid);
    setRevenue(
      paid.reduce((s, o) => s + storeSubtotalInOrder(o, store.id), 0)
    );
    setApprovedProducts(products.filter((p) => p.is_approved).length);
    setPendingProducts(products.filter((p) => !p.is_approved).length);
    const active = orders.filter((o) =>
      ["paymentConfirmed", "approved", "outForDelivery"].includes(o.status)
    );
    setActiveOrders(active.length);
    setRecentOrders(
      orders
        .filter((o) => o.status !== "pending" && o.status !== "cancelled")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
    );
    setLoading(false);
  }, [store]);

  useEffect(() => {
    if (!storeLoading) load();
  }, [load, storeLoading]);

  if (storeLoading) return <CardGridSkeleton />;

  if (!store) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Store className="mb-4 h-16 w-16 text-slate-300" />
        <h2 className="text-xl font-semibold">No store assigned</h2>
        <p className="mt-2 max-w-md text-slate-500">
          Contact admin to set up your store before you can manage products and
          orders.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-6 shadow-sm">
        {store.logo && (
          <img
            src={store.logo}
            alt=""
            className="h-16 w-16 rounded-2xl object-cover"
          />
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{store.name}</h1>
            {store.is_approved && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">{store.description}</p>
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Revenue (Paid)"
            value={formatCurrency(revenue)}
            icon={DollarSign}
          />
          <StatCard
            title="Approved Products"
            value={approvedProducts}
            icon={Package}
            iconColor="bg-accent/10 text-accent"
          />
          <StatCard
            title="Pending Products"
            value={pendingProducts}
            icon={Clock}
            iconColor="bg-amber-100 text-amber-700"
          />
          <StatCard
            title="Active Orders"
            value={activeOrders}
            icon={ShoppingBag}
            iconColor="bg-indigo-100 text-indigo-700"
          />
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet</p>
          ) : (
            recentOrders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                sellerStoreId={store.id}
                readOnly
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
