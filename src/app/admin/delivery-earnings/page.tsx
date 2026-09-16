"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Order, Profile } from "@/lib/types";
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
    Truck,
    DollarSign,
    Package,
    Search,
    UserCheck,
    Calendar,
    MapPin,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

interface DriverEarningsDetail {
    driver: Profile;
    deliveredOrders: Order[];
    totalEarnings: number;
}

export default function AdminDeliveryEarningsPage() {
    const [driverDetails, setDriverDetails] = useState<DriverEarningsDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);

    // Date Filter State
    const [dateFilter, setDateFilter] = useState<DateFilterState>({
        preset: "all",
    });

    const [rawProfiles, setRawProfiles] = useState<Profile[]>([]);
    const [rawOrders, setRawOrders] = useState<Order[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);

        const [profilesRes, ordersRes] = await Promise.all([
            supabase.from("profiles").select("*"),
            supabase.from("orders").select("*"),
        ]);

        setRawProfiles((profilesRes.data as Profile[]) ?? []);
        setRawOrders((ordersRes.data as Order[]) ?? []);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Recalculate metrics when date filter changes
    useEffect(() => {
        if (loading) return;

        // Filter orders by selected date preset
        const filteredOrders = filterRecordsByDate(
            rawOrders,
            (o) => o.delivered_at || o.date || (o as any).created_at,
            dateFilter
        );

        // Exclude Pickup orders (customers pick up themselves, no driver earnings/delivery)
        const deliveryOrders = filteredOrders.filter(
            (o) =>
                o.fulfillment_type !== "pickup" &&
                (o.delivery_person_id || o.status === "delivered" || o.status === "outForDelivery")
        );

        const driverIdsSet = new Set<string>();
        rawProfiles.forEach((p) => {
            if ((p.role as string) === "delivery" || (p.role as string) === "driver") {
                driverIdsSet.add(p.id);
            }
        });

        deliveryOrders.forEach((o) => {
            if (o.delivery_person_id) {
                driverIdsSet.add(o.delivery_person_id);
            }
        });

        const driversList: Profile[] = Array.from(driverIdsSet).map((id) => {
            const existing = rawProfiles.find((p) => p.id === id);
            return (
                existing || {
                    id,
                    name: `Driver (${id.slice(0, 6)})`,
                    email: "",
                    role: "delivery" as any,
                    phone: "+252610000000",
                    created_at: new Date().toISOString(),
                    password: "",
                    store_id: null,
                }
            );
        });

        const compiled: DriverEarningsDetail[] = driversList.map((driver) => {
            const driverOrders = deliveryOrders.filter(
                (o) => o.delivery_person_id === driver.id || (!o.delivery_person_id && (driver.role as string) === "delivery")
            );
            const totalEarnings = driverOrders.reduce(
                (sum, o) => sum + (o.fulfillment_type === "pickup" ? 0 : Number(o.delivery_fee ?? 1.30)),
                0
            );

            return {
                driver,
                deliveredOrders: driverOrders,
                totalEarnings,
            };
        });

        setDriverDetails(compiled);
    }, [dateFilter, rawOrders, rawProfiles, loading]);

    const filteredDrivers = driverDetails.filter((item) =>
        (item.driver.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        (item.driver.phone || "").includes(searchTerm)
    );

    const totalDeliveredOrdersCount = driverDetails.reduce(
        (sum, d) => sum + d.deliveredOrders.length,
        0
    );
    const totalPayoutAllDrivers = driverDetails.reduce(
        (sum, d) => sum + d.totalEarnings,
        0
    );

    const toggleExpand = (driverId: string) => {
        setExpandedDriverId(expandedDriverId === driverId ? null : driverId);
    };

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Xisaabinta & Alaabaha Darawallada (Driver Earnings & Delivered Items)"
                description="Ka ogow darawal kasta lacagta uu shaqaystay iyo alaabta ama cuntooyinka uu macmiilka u gaarsiiyay."
            />

            {/* Date Filter Bar */}
            <DateRangeFilter value={dateFilter} onChange={setDateFilter} />

            {/* Top Stat Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-purple-200 bg-purple-50/60 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-purple-800 tracking-wider">
                                🚚 Darawallada Diiwaangashan
                            </span>
                            <UserCheck className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-2xl font-black text-purple-700 mt-2">
                            {driverDetails.length} Drivers
                        </p>
                        <p className="text-[11px] text-purple-600 mt-1 font-semibold">
                            Dhammaan darawallada shaqada qabta
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider">
                                📦 Dalabyada La Gaarsiiyay
                            </span>
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-2xl font-black text-emerald-700 mt-2">
                            {totalDeliveredOrdersCount} Orders
                        </p>
                        <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
                            Wadarta dalabyada la dhameystiray
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-blue-800 tracking-wider">
                                💰 Lacagta Drivers-ka U Baxday
                            </span>
                            <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-2xl font-black text-blue-700 mt-2">
                            {formatCurrency(totalPayoutAllDrivers)}
                        </p>
                        <p className="text-[11px] text-blue-600 mt-1 font-semibold">
                            Wadarta lacagta delivery fees-ka ah
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Search className="h-5 w-5 text-slate-400 ml-2" />
                <Input
                    placeholder="Raadi magaca darawalka ama telefoonkiisa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none focus-visible:ring-0 text-sm"
                />
            </div>

            {/* Driver Cards & Detailed Ledger */}
            {loading ? (
                <TableSkeleton />
            ) : filteredDrivers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <Truck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">Wali darawal shaqeeyay ama dalab delivered ah ma jiro</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredDrivers.map(({ driver, deliveredOrders, totalEarnings }) => {
                        const isExpanded = expandedDriverId === driver.id;

                        return (
                            <Card
                                key={driver.id}
                                className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden"
                            >
                                <CardContent className="p-0">
                                    {/* Driver Header Summary Bar */}
                                    <div
                                        onClick={() => toggleExpand(driver.id)}
                                        className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="h-12 w-12 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center font-black text-purple-700 text-base">
                                                {driver.name?.slice(0, 2) || "DR"}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-extrabold text-slate-900 text-base">
                                                        {driver.name || "Delivery Driver"}
                                                    </h4>
                                                    <Badge className="bg-purple-600 text-white font-bold text-[10px]">
                                                        {driver.phone || "No Phone"}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Total Deliveries:{" "}
                                                    <span className="font-bold text-slate-800">
                                                        {deliveredOrders.length} Orders
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">
                                                    Wadarta Lacagta U Soo Gashay
                                                </p>
                                                <p className="text-xl font-black text-emerald-600 font-mono">
                                                    {formatCurrency(totalEarnings)}
                                                </p>
                                            </div>
                                            <button type="button" className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200">
                                                {isExpanded ? (
                                                    <ChevronUp className="h-5 w-5" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Collapsible Order Items Ledger */}
                                    {isExpanded && (
                                        <div className="p-5 bg-slate-50/50 space-y-4">
                                            <h5 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                                <Package className="h-4 w-4 text-primary" />
                                                Liiska Alaabaha & Cuntooyinka Uu Darawalkaan Gaarsiiyay ({deliveredOrders.length}):
                                            </h5>

                                            {deliveredOrders.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">
                                                    Wali darawalkaan wax dalab ah kama muuqdaan waqtigan.
                                                </p>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {deliveredOrders.map((order) => (
                                                        <div
                                                            key={order.id}
                                                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
                                                        >
                                                            {/* Order Metadata */}
                                                            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-extrabold text-xs text-slate-900">
                                                                            Order #{order.id.substring(0, 8)}
                                                                        </span>
                                                                        <Badge
                                                                            className={`text-[10px] ${order.status === "delivered"
                                                                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                                                : "bg-amber-100 text-amber-700 border-amber-200"
                                                                                }`}
                                                                        >
                                                                            {order.status === "delivered" ? "✅ Delivered" : `🚚 ${order.status}`}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                                        <MapPin className="h-3 w-3 text-slate-400" />
                                                                        Macmiilka:{" "}
                                                                        <span className="font-bold text-slate-700">
                                                                            {order.customer_name || "Guest"} ({order.customer_phone || "N/A"})
                                                                        </span>
                                                                        {" · "}
                                                                        {order.customer_address || "Mogadishu"}
                                                                    </p>
                                                                </div>

                                                                <div className="text-right">
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                                                                        Delivery Fee
                                                                    </span>
                                                                    <span className="text-sm font-black text-emerald-600 font-mono">
                                                                        +{formatCurrency(order.fulfillment_type === "pickup" ? 0 : Number(order.delivery_fee ?? 1.30))}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Delivered Items Visual Cards */}
                                                            <div className="space-y-1.5">
                                                                <p className="text-[11px] font-bold text-slate-400">
                                                                    Alaabta ama Cuntada la gaarsiiyay:
                                                                </p>
                                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                                    {order.items?.map((it, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-lg border border-slate-200/80"
                                                                        >
                                                                            <img
                                                                                src={
                                                                                    it.image ||
                                                                                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150"
                                                                                }
                                                                                alt={it.productName}
                                                                                className="h-10 w-10 rounded-md object-cover border border-slate-200 shrink-0"
                                                                            />
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-xs font-bold text-slate-800 truncate">
                                                                                    {it.productName}
                                                                                </p>
                                                                                <p className="text-[10px] text-slate-500 font-medium">
                                                                                    {formatCurrency(Number(it.price))} ×{" "}
                                                                                    <span className="text-rose-600 font-black">
                                                                                        x{it.quantity}
                                                                                    </span>
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
