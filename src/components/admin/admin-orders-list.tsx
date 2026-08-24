"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { storeNamesLabel } from "@/lib/order-split";
import type { Order, OrderStatus, Profile, Store } from "@/lib/types";
import { MergeCheckoutBanner } from "@/components/admin/merge-checkout-banner";
import { OrderCard } from "@/components/order-card";
import { TableSkeleton } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AdminOrdersListProps {
  statusFilter: OrderStatus | "all";
}

export function AdminOrdersList({ statusFilter }: AdminOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Record<string, string>>({});
  const [deliveryStaff, setDeliveryStaff] = useState<Profile[]>([]);
  const [deliveryByOrder, setDeliveryByOrder] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let ordersQuery = supabase
      .from("orders")
      .select("*")
      .order("date", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") {
      ordersQuery = ordersQuery.eq("status", statusFilter);
    }

    const [ordersRes, storesRes, deliveryRes] = await Promise.all([
      ordersQuery,
      supabase.from("stores").select("id, name"),
      supabase.from("profiles").select("*").eq("role", "delivery"),
    ]);

    const ordersList = (ordersRes.data as Order[]) ?? [];
    setOrders(ordersList);

    const map: Record<string, string> = {};
    (storesRes.data as Store[])?.forEach((s) => {
      map[s.id] = s.name;
    });
    setStores(map);

    const staff = (deliveryRes.data as Profile[]) ?? [];
    setDeliveryStaff(staff);

    setDeliveryByOrder((prev) => {
      const next = { ...prev };
      ordersList.forEach((o) => {
        if (o.delivery_person_id) {
          next[o.id] = o.delivery_person_id;
        } else if (
          (o.status === "pending" || o.status === "paymentConfirmed") &&
          staff.length === 1 &&
          !next[o.id]
        ) {
          next[o.id] = staff[0].id;
        }
      });
      return next;
    });

    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (deliveryStaff.length !== 1) return;
    setDeliveryByOrder((prev) => {
      const next = { ...prev };
      let changed = false;
      orders
        .filter(
          (o) =>
            (o.status === "pending" || o.status === "paymentConfirmed") &&
            !next[o.id]
        )
        .forEach((o) => {
          next[o.id] = deliveryStaff[0].id;
          changed = true;
        });
      return changed ? next : prev;
    });
  }, [deliveryStaff, orders]);

  const updateOrder = async (id: string, patch: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
    );
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
      return false;
    }
    return true;
  };

  const confirmFullOrder = async (order: Order) => {
    const dp = deliveryByOrder[order.id] ?? order.delivery_person_id;
    if (deliveryStaff.length > 0 && !dp) {
      toast.error("Dooro qofka delivery-ga, kadib Xaqiiji dalabka.");
      return;
    }

    setConfirmingId(order.id);
    const ok = await updateOrder(order.id, {
      status: "approved",
      is_paid: true,
      delivery_person_id: dp ?? null,
    });
    setConfirmingId(null);

    if (ok) {
      toast.success(
        "Dalabka waa la xaqiijiyay — seller-yada & delivery waa la diray"
      );
    }
  };

  return (
    <>
      {!loading && (
        <MergeCheckoutBanner
          orders={orders}
          storeNames={stores}
          onMerged={load}
        />
      )}

      {deliveryStaff.length === 0 && !loading && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Delivery staff ma jiro.{" "}
          <Link
            href="/admin/users/new"
            className="font-semibold text-primary underline"
          >
            Register delivery
          </Link>
        </p>
      )}

      {loading ? (
        <TableSkeleton />
      ) : orders.length === 0 ? (
        <p className="text-slate-500">Dalab ma jiro</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              storeName={storeNamesLabel(order, stores)}
              deliveryStaff={deliveryStaff}
              selectedDelivery={deliveryByOrder[order.id]}
              onDeliveryChange={(id) =>
                setDeliveryByOrder((p) => ({ ...p, [order.id]: id }))
              }
              onConfirmOrder={() => confirmFullOrder(order)}
              confirming={confirmingId === order.id}
              onApprove={() => {
                const dp =
                  deliveryByOrder[order.id] ?? order.delivery_person_id;
                if (deliveryStaff.length > 0 && !dp) {
                  toast.error("Dooro delivery");
                  return;
                }
                updateOrder(order.id, {
                  status: "approved",
                  delivery_person_id: dp ?? null,
                }).then((ok) => {
                  if (ok) toast.success("U dir delivery");
                });
              }}
              onCancel={() => updateOrder(order.id, { status: "cancelled" })}
            />
          ))}
        </div>
      )}

      {deliveryStaff.length === 0 && (
        <div className="mt-4">
          <Link href="/admin/users/new">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
              Add delivery staff
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
