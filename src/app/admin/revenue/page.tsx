"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { revenueByStoreFromOrders } from "@/lib/order-split";
import type { Order, Store, Profile } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DateRangeFilter,
  DateFilterState,
  filterRecordsByDate,
} from "@/components/date-range-filter";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Percent,
  Truck,
  Store as StoreIcon,
  ShoppingBag,
  CheckCircle2,
  Users,
  Search,
} from "lucide-react";

interface StoreRevenueRow {
  store: Store;
  revenue: number;
  orderCount: number;
}

interface DriverRevenueRow {
  driver: Profile;
  deliveryCount: number;
  totalEarnings: number;
}

export default function AdminRevenuePage() {
  const [storeRows, setStoreRows] = useState<StoreRevenueRow[]>([]);
  const [driverRows, setDriverRows] = useState<DriverRevenueRow[]>([]);
  const [totalDeliveryFees, setTotalDeliveryFees] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [rawStores, setRawStores] = useState<Store[]>([]);
  const [rawDrivers, setRawDrivers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: "all",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [storesRes, ordersRes, driversRes] = await Promise.all([
      supabase.from("stores").select("*").order("name"),
      supabase.from("orders").select("*").eq("is_paid", true),
      supabase.from("profiles").select("*").eq("role", "driver"),
    ]);

    setRawStores((storesRes.data as Store[]) ?? []);
    setRawOrders((ordersRes.data as Order[]) ?? []);
    setRawDrivers((driversRes.data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate metrics when date filter changes
  useEffect(() => {
    if (loading) return;

    // Filter orders by date
    const filteredOrders = filterRecordsByDate(
      rawOrders,
      (o) => o.date || (o as any).created_at,
      dateFilter
    );

    // 1. Store Revenue Breakdown
    const byStore = revenueByStoreFromOrders(filteredOrders);
    const compiledStoreRows: StoreRevenueRow[] = rawStores.map((store) => ({
      store,
      revenue: byStore[store.id]?.revenue ?? 0,
      orderCount: byStore[store.id]?.count ?? 0,
    }));

    // 2. Delivery Fees Calculation ($1.30 per delivery fulfillment)
    let totalDeliverySum = 0;
    const driverEarningsMap: Record<string, { count: number; total: number }> = {};

    filteredOrders.forEach((o) => {
      const isPickup = o.fulfillment_type === "pickup";
      const fee = isPickup ? 0 : Number(o.delivery_fee ?? 1.30);

      if (!isPickup) {
        totalDeliverySum += fee;

        if (o.delivery_person_id) {
          if (!driverEarningsMap[o.delivery_person_id]) {
            driverEarningsMap[o.delivery_person_id] = { count: 0, total: 0 };
          }
          driverEarningsMap[o.delivery_person_id].count += 1;
          driverEarningsMap[o.delivery_person_id].total += fee;
        }
      }
    });

    const compiledDriverRows: DriverRevenueRow[] = rawDrivers.map((d) => ({
      driver: d,
      deliveryCount: driverEarningsMap[d.id]?.count || 0,
      totalEarnings: driverEarningsMap[d.id]?.total || 0,
    }));

    setStoreRows(compiledStoreRows);
    setDriverRows(compiledDriverRows);
    setTotalDeliveryFees(totalDeliverySum);
  }, [dateFilter, rawOrders, rawStores, rawDrivers, loading]);

  const filteredStoreRows = storeRows.filter((r) =>
    r.store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDriverRows = driverRows.filter(
    (r) =>
      (r.driver.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.driver.phone || "").includes(searchTerm)
  );

  // Overall Financial Totals
  const grossProductTotal = storeRows.reduce((s, r) => s + r.revenue, 0);
  const storesNetTotal = grossProductTotal / 1.07;
  const adminCommissionTotal = grossProductTotal - storesNetTotal;
  const platformGrandTotal = grossProductTotal + totalDeliveryFees;

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Xisaabinta Faa'iidada, Dukaamada & Delivery-ga"
        description="Shaxda guud ee lagu xisaabinayo Admin 7% Commission, Lacagta Dukaamada, iyo Lacagta Gaarsiinta (Delivery Fees)."
      />

      {/* Date Range & Search Filter Bar */}
      <div className="space-y-3">
        <DateRangeFilter value={dateFilter} onChange={setDateFilter} />

        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <Search className="h-5 w-5 text-slate-400 ml-2" />
          <Input
            placeholder="Raadi magaca dukaanka ama magaca/telefoonka darawalka..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none focus-visible:ring-0 text-sm"
          />
        </div>
      </div>

      {/* 4 Main Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Admin 7% Commission */}
        <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider">
                🟢 Admin 7% Commission
              </span>
              <Percent className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-2">
              {formatCurrency(adminCommissionTotal)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-bold">
              Faa'iidada 7%-ka ah ee Admin-ka
            </p>
          </CardContent>
        </Card>

        {/* Stores Net Earnings */}
        <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-amber-800 tracking-wider">
                🟠 Lacagta Dukaamada (Net)
              </span>
              <StoreIcon className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-700 mt-2">
              {formatCurrency(storesNetTotal)}
            </p>
            <p className="text-[11px] text-amber-600 mt-1 font-bold">
              Wadarta lacagta asalka ah ee Dukaamada
            </p>
          </CardContent>
        </Card>

        {/* Delivery Fees Total */}
        <Card className="border-purple-200 bg-purple-50/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-purple-800 tracking-wider">
                🚚 Lacagta Delivery-ga
              </span>
              <Truck className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-700 mt-2">
              {formatCurrency(totalDeliveryFees)}
            </p>
            <p className="text-[11px] text-purple-600 mt-1 font-bold">
              Wadarta lacagta gaarsiinta (Drivers)
            </p>
          </CardContent>
        </Card>

        {/* Grand Total Revenue */}
        <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-blue-800 tracking-wider">
                🔵 Grand Total Handled
              </span>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-700 mt-2">
              {formatCurrency(platformGrandTotal)}
            </p>
            <p className="text-[11px] text-blue-600 mt-1 font-bold">
              Wadarta guud ee iibka + delivery-ga
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Store Revenue & Commission Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <StoreIcon className="h-5 w-5 text-amber-600" />
            1. Lacagaha & Commission-ka Dukaamada (Store Earnings Breakdown)
          </h3>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Dukaanka (Store)</th>
                    <th className="py-3.5 px-4">Paid Orders</th>
                    <th className="py-3.5 px-4 text-right">Seller Net Payout (93%)</th>
                    <th className="py-3.5 px-4 text-right">Admin 7% Commission</th>
                    <th className="py-3.5 px-4 text-right">Gross Total (100%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStoreRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400 font-semibold">
                        Wax dukaan ah oo meeshaan lagu helay ma jiro.
                      </td>
                    </tr>
                  ) : (
                    filteredStoreRows
                      .sort((a, b) => b.revenue - a.revenue)
                      .map(({ store, revenue, orderCount }) => {
                        const sellerNet = revenue / 1.07;
                        const adminFee = revenue - sellerNet;

                        return (
                          <tr key={store.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {store.logo ? (
                                  <img
                                    src={store.logo}
                                    alt={store.name}
                                    className="h-9 w-9 rounded-lg object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                    {store.name.slice(0, 2)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-900">{store.name}</p>
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                    {store.is_restaurant ? "Maqaayad" : "Dukaan"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge variant="secondary" className="font-bold">
                                {orderCount} orders
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-amber-600 font-mono">
                              {formatCurrency(sellerNet)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 font-mono">
                              +{formatCurrency(adminFee)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono">
                              {formatCurrency(revenue)}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Delivery Drivers Revenue Table */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-purple-600" />
            2. Xisaabinta Darawallada Gaarsiinta (Delivery Driver Earnings)
          </h3>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Darawalka (Driver Name)</th>
                    <th className="py-3.5 px-4">Telefoonka</th>
                    <th className="py-3.5 px-4">Deliveries Completed</th>
                    <th className="py-3.5 px-4 text-right">Lacagta U Soo Gashay (Delivery Fees)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredDriverRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">
                        Wax darawal ah oo raadintaada ku soo baxay ma jiro.
                      </td>
                    </tr>
                  ) : (
                    filteredDriverRows.map(({ driver, deliveryCount, totalEarnings }) => (
                      <tr key={driver.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          {driver.name || "Driver"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                          {driver.phone || "N/A"}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-bold">
                            🚚 {deliveryCount} Deliveries
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-purple-700 font-mono text-base">
                          {formatCurrency(totalEarnings)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
