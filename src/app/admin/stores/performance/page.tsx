"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { revenueByStoreFromOrders } from "@/lib/order-split";
import type { Order, Store, OrderItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StoresSubNav } from "@/components/admin/admin-nav-links";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/loading-skeleton";
import { TrendingUp, Calendar, DollarSign, CalendarDays, ShoppingBag, Eye, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PerformanceRow {
    store: Store;
    todayRevenue: number;
    last5DaysRevenue: number;
    totalOrders: number;
}

interface DailyStoreSummary {
    storeId: string;
    storeName: string;
    logo: string | null;
    itemsCount: number; // Number of items sold
    revenue: number; // Money made
    itemsList: { productName: string; quantity: number; price: number }[];
}

export default function AdminStoresPerformancePage() {
    const [rows, setRows] = useState<PerformanceRow[]>([]);
    const [loading, setLoading] = useState(true);

    // Daily Store Sales states
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date();
        // Return YYYY-MM-DD in local time
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });

    const [dailySummaries, setDailySummaries] = useState<DailyStoreSummary[]>([]);
    const [loadingDaily, setLoadingDaily] = useState(false);
    const [activeTab, setActiveTab] = useState<"daily" | "trends">("daily");

    // Load trends (Today & 5-day summaries)
    const loadTrends = useCallback(async () => {
        setLoading(true);
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
            fiveDaysAgo.setHours(0, 0, 0, 0);
            const last5DaysStart = fiveDaysAgo.toISOString();

            const [storesRes, ordersRes] = await Promise.all([
                supabase.from("stores").select("*").order("name"),
                supabase.from("orders").select("*").eq("is_paid", true).gte("date", last5DaysStart),
            ]);

            const stores = (storesRes.data as Store[]) ?? [];
            const orders = (ordersRes.data as Order[]) ?? [];

            const todayOrders = orders.filter(o => o.date >= todayStart);
            const last5DaysOrders = orders;

            const todayStats = revenueByStoreFromOrders(todayOrders);
            const last5DaysStats = revenueByStoreFromOrders(last5DaysOrders);

            setRows(
                stores.map((store) => ({
                    store,
                    todayRevenue: todayStats[store.id]?.revenue ?? 0,
                    last5DaysRevenue: last5DaysStats[store.id]?.revenue ?? 0,
                    totalOrders: last5DaysStats[store.id]?.count ?? 0,
                }))
            );
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch Daily performance (Specific Selected Date)
    const loadDailyPerformance = useCallback(async () => {
        setLoadingDaily(true);
        try {
            // Get all stores
            const { data: storesList = [] } = await supabase.from("stores").select("*");

            // Fetch all paid orders for the chosen date segment
            // Format start and end date of that local calendar date
            const startOfDay = `${selectedDate}T00:00:00.000Z`;
            const endOfDay = `${selectedDate}T23:59:59.999Z`;

            const { data: orders = [], error } = await supabase
                .from("orders")
                .select("*")
                .eq("is_paid", true)
                .gte("created_at", startOfDay)
                .lte("created_at", endOfDay);

            if (error) {
                // Fallback search with date field if target created_at has timezone mismatch
                const { data: dateFieldOrders = [] } = await supabase
                    .from("orders")
                    .select("*")
                    .eq("is_paid", true);

                // Filter in JS by matching local ISO date string segment
                const filtered = (dateFieldOrders || []).filter((o) => {
                    if (!o.date) return false;
                    return o.date.startsWith(selectedDate);
                });
                processOrdersForDay(filtered, storesList || []);
            } else {
                processOrdersForDay(orders || [], storesList || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDaily(false);
        }
    }, [selectedDate]);

    const processOrdersForDay = (orders: Order[], stores: Store[]) => {
        const summaryMap: Record<string, DailyStoreSummary> = {};

        // Initialize all stores
        stores.forEach((st) => {
            summaryMap[st.id] = {
                storeId: st.id,
                storeName: st.name,
                logo: st.logo || null,
                itemsCount: 0,
                revenue: 0,
                itemsList: [],
            };
        });

        // Parse orders and sum counts
        orders.forEach((order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            items.forEach((item: OrderItem) => {
                const sid = item.storeId;
                if (!sid) return;

                // If store wasn't initialized
                if (!summaryMap[sid]) {
                    summaryMap[sid] = {
                        storeId: sid,
                        storeName: item.storeName || `Store (${sid.substring(0, 4)})`,
                        logo: null,
                        itemsCount: 0,
                        revenue: 0,
                        itemsList: [],
                    };
                }

                const qty = Number(item.quantity || 0);
                const price = Number(item.price || 0);
                const lineTotal = price * qty;

                summaryMap[sid].itemsCount += qty;
                summaryMap[sid].revenue += lineTotal;

                // Add item detail list
                const existingIdx = summaryMap[sid].itemsList.findIndex(x => x.productName === item.productName);
                if (existingIdx > -1) {
                    summaryMap[sid].itemsList[existingIdx].quantity += qty;
                } else {
                    summaryMap[sid].itemsList.push({
                        productName: item.productName || "Product",
                        quantity: qty,
                        price,
                    });
                }
            });
        });

        setDailySummaries(Object.values(summaryMap));
    };

    useEffect(() => {
        loadTrends();
    }, [loadTrends]);

    useEffect(() => {
        loadDailyPerformance();
    }, [loadDailyPerformance]);

    // Daily aggregate stats
    const dailyTotalItems = dailySummaries.reduce((sum, s) => sum + s.itemsCount, 0);
    const dailyTotalRevenue = dailySummaries.reduce((sum, s) => sum + s.revenue, 0);

    return (
        <div className="pb-10 space-y-6">
            <PageHeader
                title="Shaqada Dukaamada"
                description="Maamul oo la soco dukaamada waxa ay gadaan iyo lacagta ay qabtaan maalin kasta."
            />
            <StoresSubNav />

            {/* Tabs selectors */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab("daily")}
                    className={`py-3 px-6 font-semibold text-sm border-b-2 transition -mb-px flex items-center gap-2 cursor-pointer ${activeTab === "daily"
                            ? "border-primary text-primary"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <CalendarDays className="h-4.5 w-4.5" /> Maalinta Gaarka ah (Daily Analyzer)
                </button>
                <button
                    onClick={() => setActiveTab("trends")}
                    className={`py-3 px-6 font-semibold text-sm border-b-2 transition -mb-px flex items-center gap-2 cursor-pointer ${activeTab === "trends"
                            ? "border-primary text-primary"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <TrendingUp className="h-4.5 w-4.5" /> Shanta casho u dambaysay (Trends)
                </button>
            </div>

            {activeTab === "daily" ? (
                <div className="space-y-6 animate-fade-in">
                    {/* Controls Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-slate-500" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dooro Maalinta</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-sm font-semibold outline-none focus:ring-1 focus:ring-primary text-slate-750"
                                />
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Maalintaas Waxaa la gatay</p>
                                <p className="text-lg font-extrabold text-slate-800">{dailyTotalItems} Shay</p>
                            </div>
                            <div className="text-right border-l pl-6 border-slate-205">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Qiimaha Soo Baxay</p>
                                <p className="text-lg font-extrabold text-emerald-600 font-mono">{formatCurrency(dailyTotalRevenue)}</p>
                            </div>
                        </div>
                    </div>

                    {loadingDaily ? (
                        <TableSkeleton />
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-650 font-semibold border-b border-slate-100 uppercase text-xs">
                                        <tr>
                                            <th className="py-4 px-6">Dukaan (Store)</th>
                                            <th className="py-4 px-6 text-center">Inta Shay ($Quantity)</th>
                                            <th className="py-4 px-6 text-right">Qiimaha Maalintaas</th>
                                            <th className="py-4 px-6">Alaabaha la gatay (Product Breakdown)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {dailySummaries.map((summary) => (
                                            <tr key={summary.storeId} className="hover:bg-slate-50/40 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        {summary.logo ? (
                                                            <img
                                                                src={summary.logo}
                                                                alt={summary.storeName}
                                                                className="h-10 w-10 rounded-xl object-cover border border-slate-100"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm">
                                                                {summary.storeName.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className="font-bold text-slate-800">{summary.storeName}</span>
                                                    </div>
                                                </td>

                                                <td className="py-4 px-6 text-center">
                                                    {summary.itemsCount > 0 ? (
                                                        <Badge className="bg-primary/10 text-primary font-bold text-sm border-none px-3 py-1 rounded-lg">
                                                            {summary.itemsCount} xabado
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">-</span>
                                                    )}
                                                </td>

                                                <td className="py-4 px-6 text-right">
                                                    <span className={`font-mono text-base font-bold ${summary.revenue > 0 ? "text-emerald-600" : "text-slate-400"
                                                        }`}>
                                                        {formatCurrency(summary.revenue)}
                                                    </span>
                                                </td>

                                                <td className="py-4 px-6 text-xs text-slate-600 max-w-sm">
                                                    {summary.itemsList.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {summary.itemsList.map((item, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex items-center bg-slate-100 text-slate-850 px-2 py-1 rounded-md font-medium border border-slate-200/50"
                                                                >
                                                                    {item.productName}
                                                                    <strong className="text-primary ml-1 font-bold">x{item.quantity}</strong>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Wax alaab ah ma gadan maanta</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}

                                        {dailySummaries.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center py-12 text-slate-400">
                                                    Maalinta la doortay ee {selectedDate} wax iib ah kama dhici dukaamada.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in">
                    {loading ? (
                        <TableSkeleton />
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {rows
                                .sort((a, b) => b.last5DaysRevenue - a.last5DaysRevenue)
                                .map(({ store, todayRevenue, last5DaysRevenue, totalOrders }) => (
                                    <Card key={store.id} className="overflow-hidden border-none shadow-sm bg-white border border-slate-100">
                                        <div className="h-1 bg-primary w-full" />
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-3 mb-4">
                                                {store.logo ? (
                                                    <img
                                                        src={store.logo}
                                                        alt=""
                                                        className="h-12 w-12 rounded-xl object-cover border border-slate-100"
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 rounded-xl bg-slate-105 flex items-center justify-center">
                                                        <TrendingUp className="w-6 h-6 text-slate-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{store.name}</h3>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                                        {totalOrders} Dalabaad (5 Days)
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-emerald-50/80 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                                        <span className="text-sm font-medium text-emerald-700">Maanta dakhliga</span>
                                                    </div>
                                                    <span className="text-lg font-bold text-emerald-700">
                                                        {formatCurrency(todayRevenue)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-blue-50/80 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm font-medium text-blue-700">5-tii Casho u dambaysay</span>
                                                    </div>
                                                    <span className="text-lg font-bold text-blue-700">
                                                        {formatCurrency(last5DaysRevenue)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    )}

                    {rows.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Wax dukaan ah weli lama helin.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
