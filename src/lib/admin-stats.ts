import { supabase } from "@/lib/supabase";
import type { OrderStatus } from "@/lib/types";

export interface DashboardStats {
  paidRevenue: number;
  pendingOrders: number;
  totalStores: number;
  deliveryStaff: number;
  pendingProducts: number;
  pendingStores: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [
    paidOrdersRes,
    pendingOrdersRes,
    storesRes,
    deliveryRes,
    pendingProductsRes,
    pendingStoresRes,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total_amount")
      .eq("is_paid", true),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "delivery"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", false),
    supabase
      .from("stores")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", false),
  ]);

  const paidRows = paidOrdersRes.data ?? [];
  const paidRevenue = paidRows.reduce(
    (s, o) => s + Number(o.total_amount),
    0
  );

  return {
    paidRevenue,
    pendingOrders: pendingOrdersRes.count ?? 0,
    totalStores: storesRes.count ?? 0,
    deliveryStaff: deliveryRes.count ?? 0,
    pendingProducts: pendingProductsRes.count ?? 0,
    pendingStores: pendingStoresRes.count ?? 0,
  };
}

export async function fetchOrderCountByStatus(
  status: OrderStatus
): Promise<number> {
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  return count ?? 0;
}

export async function fetchAllOrdersCount(): Promise<number> {
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}
