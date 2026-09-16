"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import type { Store, Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    Clock,
    ShoppingBag,
    CheckCircle,
    Truck,
    Utensils,
    Search,
    Filter,
    X,
    RotateCcw,
    SlidersHorizontal,
    Store as StoreIcon,
} from "lucide-react";

export default function RestaurantOrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [fulfillmentFilter, setFulfillmentFilter] = useState<string>("all");
    const [sourceFilter, setSourceFilter] = useState<string>("all");

    const loadData = useCallback(async () => {
        setLoading(true);
        const [storesRes, ordersRes] = await Promise.all([
            supabase.from("stores").select("*"),
            supabase.from("orders").select("*"),
        ]);

        const allStores = (storesRes.data as Store[]) ?? [];
        const allOrders = (ordersRes.data as Order[]) ?? [];

        let myStore = allStores.find((s) => s.owner_id === user?.id && (s.is_restaurant || s.name.toLowerCase().includes("restaurant")));
        if (!myStore && allStores.length > 0) {
            myStore = allStores.find((s) => s.is_restaurant) || allStores[0];
        }

        if (myStore) {
            const storeOrders = allOrders.filter((o) => o.store_id === myStore.id);
            setOrders(storeOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        loadData();

        const channel = supabase
            .channel("restaurant_orders_page_realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                () => {
                    loadData();
                    toast.success("🔔 Order mpya ayaa soo dhacday!");
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadData]);

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setFulfillmentFilter("all");
        setSourceFilter("all");
    };

    // Filtered orders
    const filteredOrders = orders.filter((o) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
            !query ||
            o.id.toLowerCase().includes(query) ||
            (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
            (o.customer_phone && o.customer_phone.toLowerCase().includes(query)) ||
            (o.customer_address && o.customer_address.toLowerCase().includes(query)) ||
            (o.items && o.items.some((it) => it.productName.toLowerCase().includes(query)));

        let matchesStatus = true;
        if (statusFilter === "pending") matchesStatus = o.status === "pending" || o.status === "paymentConfirmed";
        else if (statusFilter === "approved") matchesStatus = o.status === "approved";
        else if (statusFilter === "outForDelivery") matchesStatus = o.status === "outForDelivery";
        else if (statusFilter === "delivered") matchesStatus = o.status === "delivered";

        let matchesFulfillment = true;
        if (fulfillmentFilter === "pickup") matchesFulfillment = o.fulfillment_type === "pickup";
        else if (fulfillmentFilter === "delivery") matchesFulfillment = o.fulfillment_type !== "pickup";

        let matchesSource = true;
        if (sourceFilter === "pos") matchesSource = !!o.is_pos_order;
        else if (sourceFilter === "online") matchesSource = !o.is_pos_order;

        return matchesQuery && matchesStatus && matchesFulfillment && matchesSource;
    });

    const isFiltered = searchQuery !== "" || statusFilter !== "all" || fulfillmentFilter !== "all" || sourceFilter !== "all";

    return (
        <div className="space-y-6">
            {/* Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 p-6 rounded-3xl text-white shadow-xl">
                <div>
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black uppercase">
                        LIVE ORDERS STREAM
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black mt-2">
                        Incoming Real-time Orders Stream
                    </h1>
                    <p className="text-xs text-slate-300 mt-1">
                        Liiska tooska ah ee dalabyada soo dhacaya maqaayada (Real-time updates).
                    </p>
                </div>
                <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold px-4 py-2 animate-pulse self-start sm:self-auto">
                    ● REAL-TIME ACTIVE
                </Badge>
            </div>

            {/* Search and Filtering Toolbar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Raadi Order ID, Magaca macmiilka, Taleefan, Cinwaan, ama Cunto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-9 bg-slate-950 border-slate-800 text-white rounded-xl text-xs h-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Select Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                            <Clock className="h-3.5 w-3.5 text-amber-400" />
                            <span className="font-bold text-slate-400">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent font-extrabold text-white outline-hidden cursor-pointer"
                            >
                                <option value="all">Dhammaan</option>
                                <option value="pending">⏳ Pending</option>
                                <option value="approved">👨‍🍳 Preparing</option>
                                <option value="outForDelivery">🚚 Driver Picked Up</option>
                                <option value="delivered">✅ Delivered</option>
                            </select>
                        </div>

                        {/* Fulfillment Filter */}
                        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                            <Truck className="h-3.5 w-3.5 text-blue-400" />
                            <span className="font-bold text-slate-400">Gaarsiin:</span>
                            <select
                                value={fulfillmentFilter}
                                onChange={(e) => setFulfillmentFilter(e.target.value)}
                                className="bg-transparent font-extrabold text-white outline-hidden cursor-pointer"
                            >
                                <option value="all">Dhammaan</option>
                                <option value="pickup">🚶‍♂️ Pickup (Iska soo doono)</option>
                                <option value="delivery">🚚 Delivery (Gaarsiin)</option>
                            </select>
                        </div>

                        {/* Source Filter */}
                        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                            <ShoppingBag className="h-3.5 w-3.5 text-rose-400" />
                            <span className="font-bold text-slate-400">Source:</span>
                            <select
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value)}
                                className="bg-transparent font-extrabold text-white outline-hidden cursor-pointer"
                            >
                                <option value="all">Dhammaan</option>
                                <option value="pos">⚡ POS Direct</option>
                                <option value="online">📱 Online App</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        {isFiltered && (
                            <Button
                                variant="ghost"
                                onClick={clearFilters}
                                className="h-9 px-3 text-xs font-bold text-rose-400 hover:bg-rose-950/40 rounded-xl gap-1.5"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Clear
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                    <span>
                        Muujinayaa <strong>{filteredOrders.length}</strong> dalab oo ka mid ah <strong>{orders.length}</strong>
                    </span>
                    {isFiltered && (
                        <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                            Filtered Active
                        </Badge>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    <Skeleton className="h-28 w-full rounded-2xl bg-slate-800" />
                    <Skeleton className="h-28 w-full rounded-2xl bg-slate-800" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <Card className="p-12 text-center border-slate-800 bg-slate-900/40 rounded-3xl">
                    <ShoppingBag className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                    <p className="font-bold text-slate-300">
                        {isFiltered ? "Dalab la feltereeyay ama la raadiyay lama helin" : "Wali dalab cusub ma soo dhacin"}
                    </p>
                    {isFiltered && (
                        <Button
                            onClick={clearFilters}
                            className="mt-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                        >
                            Set-ka celi (Clear Filters)
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((o) => {
                        let statusBadge = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                        let statusLabel = "Pending";

                        if (o.status === "approved") {
                            statusBadge = "bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold";
                            statusLabel = "Preparing / In Delivery Pool";
                        } else if (o.status === "outForDelivery") {
                            statusBadge = "bg-blue-500/20 text-blue-300 border-blue-500/30 font-bold";
                            statusLabel = "Driver Picked Up";
                        } else if (o.status === "delivered") {
                            statusBadge = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold";
                            statusLabel = "Delivered ✅";
                        }

                        return (
                            <Card key={o.id} className="border-slate-800 bg-slate-900 rounded-2xl p-5 shadow-lg">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-white text-sm">
                                                Order #{o.id.substring(0, 8)}
                                            </span>
                                            <Badge className={statusBadge}>{statusLabel}</Badge>
                                            {o.fulfillment_type === "pickup" ? (
                                                <Badge className="bg-emerald-600 text-white font-extrabold text-[10px]">
                                                    🚶‍♂️ PICKUP
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-blue-600 text-white font-bold text-[10px]">
                                                    🚚 GAARSIIN
                                                </Badge>
                                            )}
                                            {o.is_pos_order && (
                                                <Badge className="bg-rose-600 text-white font-bold text-[9px]">
                                                    POS DIRECT
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Macmiilka: <span className="font-bold text-white">{o.customer_name || "Guest Customer"}</span> ({o.customer_phone || "N/A"})
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Cinwaanka: {o.customer_address || "Standard Delivery"}
                                        </p>
                                    </div>

                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Total Paid</p>
                                        <p className="text-xl font-black text-rose-400">
                                            {formatCurrency(Number(o.total_amount))}
                                        </p>
                                        <span className="text-[10px] font-bold text-emerald-400">
                                            {o.payment_method?.toUpperCase()} (PAID)
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Items:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {o.items?.map((it, idx) => (
                                            <span
                                                key={idx}
                                                className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-3 py-1 rounded-lg font-bold"
                                            >
                                                {it.quantity}x {it.productName} ({formatCurrency(Number(it.price))})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
