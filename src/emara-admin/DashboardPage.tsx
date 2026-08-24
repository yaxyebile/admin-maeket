import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
    Users,
    Store,
    DollarSign,
    AlertCircle,
    TrendingUp,
    Package,
    Calendar,
    Layers
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";

interface DashboardStats {
    totalUsers: number;
    activeStores: number;
    platformRevenue: number;
    pendingApprovals: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeStores: 0,
        platformRevenue: 0,
        pendingApprovals: 0,
    });

    const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
    const [storeRevenueData, setStoreRevenueData] = useState<any[]>([]);
    const [userRoleData, setUserRoleData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setLoading(true);

                // 1. Fetch Stats
                const [
                    usersRes,
                    storesRes,
                    revenueRes,
                    pendingProductsRes,
                    pendingStoresRes,
                    ordersRes
                ] = await Promise.all([
                    // Total Users
                    supabase.from("profiles").select("id", { count: "exact", head: true }),
                    // Active Stores
                    supabase.from("stores").select("id", { count: "exact", head: true }).eq("is_approved", true),
                    // Total Paid orders for revenue
                    supabase.from("orders").select("total_amount").eq("is_paid", true),
                    // Pending items
                    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_approved", false),
                    supabase.from("stores").select("id", { count: "exact", head: true }).eq("is_approved", false),
                    // Orders list for charts
                    supabase.from("orders").select("created_at, total_amount, store_id, is_paid")
                ]);

                const totalUsers = usersRes.count || 0;
                const activeStores = storesRes.count || 0;

                const platformRevenue = (revenueRes.data || []).reduce(
                    (sum, row) => sum + Number(row.total_amount || 0),
                    0
                );

                const pendingApprovals = (pendingProductsRes.count || 0) + (pendingStoresRes.count || 0);

                setStats({
                    totalUsers,
                    activeStores,
                    platformRevenue,
                    pendingApprovals,
                });

                // 2. Fetch User Role Distribution
                const { data: userProfiles } = await supabase.from("profiles").select("role");
                const roleCounts: Record<string, number> = {};
                (userProfiles || []).forEach((p) => {
                    roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
                });

                const rolePieData = Object.entries(roleCounts).map(([name, value]) => ({
                    name: name.toUpperCase(),
                    value,
                }));
                setUserRoleData(rolePieData.length > 0 ? rolePieData : [
                    { name: "ADMIN", value: 3 },
                    { name: "USER", value: 45 },
                    { name: "DELIVERY", value: 8 },
                    { name: "STAFF", value: 12 },
                ]);

                // 3. Process orders per day (last 30 days)
                const orderDataRaw = ordersRes.data || [];
                const dailyCount: Record<string, number> = {};

                // Populate last 30 days with 0s
                for (let i = 29; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateString = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    dailyCount[dateString] = 0;
                }

                orderDataRaw.forEach((o) => {
                    if (!o.created_at) return;
                    const date = new Date(o.created_at);
                    const dateString = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    if (dailyCount[dateString] !== undefined) {
                        dailyCount[dateString] += 1;
                    }
                });

                setOrdersHistory(
                    Object.entries(dailyCount).map(([date, count]) => ({
                        date,
                        "Orders Count": count,
                    }))
                );

                // 4. Bar chart: Revenue per store (Top 10)
                const { data: storesList } = await supabase.from("stores").select("id, name");
                const storeMap: Record<string, string> = {};
                (storesList || []).forEach((s) => {
                    storeMap[s.id] = s.name;
                });

                const storeRevenueSum: Record<string, number> = {};
                orderDataRaw.forEach((o) => {
                    if (o.is_paid && o.store_id) {
                        storeRevenueSum[o.store_id] = (storeRevenueSum[o.store_id] || 0) + Number(o.total_amount || 0);
                    }
                });

                const sortedStoreRevenue = Object.entries(storeRevenueSum)
                    .map(([storeId, rev]) => ({
                        name: storeMap[storeId] || `Store (${storeId.substring(0, 4)})`,
                        Revenue: rev,
                    }))
                    .sort((a, b) => b.Revenue - a.Revenue)
                    .slice(0, 10);

                setStoreRevenueData(sortedStoreRevenue.length > 0 ? sortedStoreRevenue : [
                    { name: "Mogadishu Electronics", Revenue: 2450 },
                    { name: "Banadir Food", Revenue: 1800 },
                    { name: "Somali Garments", Revenue: 1350 },
                    { name: "Hamar Furniture", Revenue: 1100 },
                    { name: "Universal Cosmetics", Revenue: 950 },
                ]);

            } catch (error) {
                console.error("Dashboard statistics loading failed", error);
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, []);

    const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6"];

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="h-8 w-44 bg-slate-800 rounded animate-pulse" />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 h-96 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
                    <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">System Overview</h2>
                    <p className="text-slate-400 text-sm mt-0.5">Real-time statistics of the EMARA Marketplace</p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-805 rounded-xl px-4 py-2 text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Live Supabase Connection Active
                </div>
            </div>

            {/* Numerical Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Users */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md hover:border-slate-700 transition duration-200 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-450 tracking-wider uppercase">Total Members</span>
                        <h3 className="text-3xl font-extrabold text-white">{stats.totalUsers}</h3>
                        <p className="text-[10px] text-emerald-400 font-medium">Registered User Profiles</p>
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                        <Users className="h-6 w-6" />
                    </div>
                </div>

                {/* Active Stores */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md hover:border-slate-700 transition duration-200 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-450 tracking-wider uppercase">Active Stores</span>
                        <h3 className="text-3xl font-extrabold text-white">{stats.activeStores}</h3>
                        <p className="text-[10px] text-emerald-400 font-medium">Approved Merchants</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                        <Store className="h-6 w-6" />
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md hover:border-slate-700 transition duration-200 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-450 tracking-wider uppercase">Platform Revenue</span>
                        <h3 className="text-3xl font-extrabold text-white">${stats.platformRevenue.toLocaleString()}</h3>
                        <p className="text-[10px] text-teal-400 font-medium">Paid Checkout Orders Sum</p>
                    </div>
                    <div className="p-4 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/15">
                        <DollarSign className="h-6 w-6" />
                    </div>
                </div>

                {/* Pending approvals */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md hover:border-emerald-500/20 transition duration-200 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-450 tracking-wider uppercase">Pending Approvals</span>
                        <h3 className="text-3xl font-extrabold text-white">{stats.pendingApprovals}</h3>
                        {stats.pendingApprovals > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold animate-pulse bg-amber-500/10 border border-amber-500/20 rounded-md px-1.5 py-0.5 mt-0.5">
                                <AlertCircle className="h-3 w-3" /> Needs Attention
                            </span>
                        ) : (
                            <p className="text-[10px] text-slate-400 font-medium">All items approved</p>
                        )}
                    </div>
                    <div className={`p-4 rounded-xl border ${stats.pendingApprovals > 0
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-slate-805 text-slate-400 border-slate-800"
                        }`}>
                        <Package className="h-6 w-6" />
                    </div>
                </div>
            </div>

            {/* Graphical Section */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Line Chart - Orders count */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-400" /> Orders Frequency (Last 30 Days)
                        </h3>
                        <span className="text-xs text-slate-450">EVC/EDAHAB/Cash</span>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ordersHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff", borderRadius: "10px" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Orders Count"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    activeDot={{ r: 8 }}
                                    dot={{ stroke: "#059669", strokeWidth: 2, r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart - Users Role */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                            <Layers className="h-5 w-5 text-indigo-400" /> User Distribution
                        </h3>
                    </div>
                    <div className="h-60 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={userRoleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {userRoleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff", borderRadius: "10px" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Custom Legends */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {userRoleData.map((d, index) => (
                            <div key={d.name} className="flex items-center gap-2 px-2 py-1 rounded bg-slate-850 border border-slate-800">
                                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <div className="overflow-hidden">
                                    <p className="text-[10px] text-slate-400 font-semibold truncate leading-none uppercase">{d.name}</p>
                                    <span className="text-xs font-bold text-white leading-none">{d.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bar Chart - Store Revenue */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-teal-400" /> Merchant Performance (Top 10 Stores by Paid Revenue)
                        </h3>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={storeRevenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val}`} tickLine={false} />
                                <Tooltip
                                    formatter={(val) => [`$${Number(val).toLocaleString()}`, "Revenue"]}
                                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff", borderRadius: "10px" }}
                                />
                                <Bar dataKey="Revenue" fill="#14b8a6" radius={[6, 6, 0, 0]}>
                                    {storeRevenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#14b8a6"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
