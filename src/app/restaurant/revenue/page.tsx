"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import type { Store, Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, ShoppingBag, CreditCard, Sparkles } from "lucide-react";

export default function RestaurantRevenuePage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);

    const loadData = useCallback(async () => {
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
            setOrders(allOrders.filter((o) => o.store_id === myStore.id));
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const totalRevenue = orders
        .filter((o) => o.is_paid)
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const evcRevenue = orders
        .filter((o) => o.is_paid && (o.payment_method === "evcPlus" || (o.payment_method as string) === "evc"))
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const cashRevenue = orders
        .filter((o) => o.is_paid && o.payment_method === "cash")
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 p-6 rounded-3xl text-white shadow-xl">
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black uppercase">
                    REVENUE ANALYTICS
                </span>
                <h1 className="text-2xl sm:text-3xl font-black mt-2">
                    Dakhliga & Lacag Bixinta Maqaayada
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                    Kormeer dakhliga guud, EVC Plus, Cash, iyo POS sales.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-slate-900 border-slate-800 rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-rose-400 uppercase">Total Revenue</p>
                            <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(totalRevenue)}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-emerald-400 uppercase">EVC / Mobile Paid</p>
                            <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(evcRevenue)}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                            <CreditCard className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-amber-400 uppercase">Cash Paid</p>
                            <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(cashRevenue)}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
