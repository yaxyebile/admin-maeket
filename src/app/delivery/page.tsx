"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import type { Order, Profile } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    PackageCheck,
    Truck,
    CheckCircle2,
    Phone,
    MapPin,
    User,
    RefreshCw,
    ShoppingBag,
    AlertTriangle,
    Clock,
    ShieldAlert,
    Zap,
} from "lucide-react";

export default function DeliveryDashboardPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    // Active delivery driver profile
    const [deliveryDrivers, setDeliveryDrivers] = useState<Profile[]>([]);
    const [activeDriverId, setActiveDriverId] = useState<string>("");
    const [activeDriverName, setActiveDriverName] = useState<string>("");

    // Orders State
    const [openPoolOrders, setOpenPoolOrders] = useState<Order[]>([]);
    const [myActiveDeliveries, setMyActiveDeliveries] = useState<Order[]>([]);
    const [myCompletedDeliveries, setMyCompletedDeliveries] = useState<Order[]>([]);

    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [deliveringId, setDeliveringId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    // Load delivery drivers list
    const loadDrivers = useCallback(async () => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "delivery");

        const drivers = (data as Profile[]) ?? [];
        setDeliveryDrivers(drivers);

        if (user && user.role === "delivery") {
            setActiveDriverId(user.id);
            setActiveDriverName(user.name);
        } else if (drivers.length > 0) {
            setActiveDriverId(drivers[0].id);
            setActiveDriverName(drivers[0].name);
        } else {
            // Fallback driver ID for demo
            const demoId = user?.id || "demo-driver-1";
            setActiveDriverId(demoId);
            setActiveDriverName(user?.name || "Driver Cabdi");
        }
    }, [user]);

    // Load orders query
    const loadOrders = useCallback(async () => {
        setLoading(true);

        // Fetch all orders
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .order("date", { ascending: false });

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        const allOrders = (data as Order[]) ?? [];

        // Filter Open Pool orders:
        // Only show orders meant for delivery (fulfillment_type !== 'pickup'), status is 'approved'/'paymentConfirmed', is_paid is true, and no driver assigned yet
        const openPool = allOrders.filter(
            (o) =>
                (o.status === "approved" || o.status === "paymentConfirmed") &&
                o.is_paid &&
                !o.delivery_person_id &&
                (!o.fulfillment_type || o.fulfillment_type === "delivery")
        );

        // Filter driver's active deliveries:
        // delivery_person_id matches current driver and status is 'outForDelivery'
        const active = allOrders.filter(
            (o) =>
                o.delivery_person_id === activeDriverId &&
                o.status === "outForDelivery"
        );

        // Filter completed deliveries:
        // delivery_person_id matches current driver and status is 'delivered'
        const completed = allOrders.filter(
            (o) =>
                o.delivery_person_id === activeDriverId && o.status === "delivered"
        );

        setOpenPoolOrders(openPool);
        setMyActiveDeliveries(active);
        setMyCompletedDeliveries(completed);
        setLoading(false);
    }, [activeDriverId]);

    useEffect(() => {
        loadDrivers();
    }, [loadDrivers]);

    useEffect(() => {
        if (activeDriverId) {
            loadOrders();
        }
    }, [activeDriverId, loadOrders]);

    // Set up Supabase Realtime listener so pool updates instantly across all windows/devices!
    useEffect(() => {
        const channel = supabase
            .channel("orders_realtime_pool")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                },
                () => {
                    loadOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadOrders]);

    /**
     * First-Come, First-Served Claiming Logic with Double-Claim Protection
     */
    const handleClaimOrder = async (order: Order) => {
        if (!activeDriverId) {
            toast.error("Dooro ama soo gal akoon delivery wadaha!");
            return;
        }

        setClaimingId(order.id);

        try {
            // Step 1: Double-Claim Protection Check
            // Fetch latest state directly from DB before claiming
            const { data: latestOrder, error: checkError } = await supabase
                .from("orders")
                .select("delivery_person_id, status")
                .eq("id", order.id)
                .single();

            if (checkError) {
                toast.error("Cilad ayaa dhacday marka la eegayay dalabka.");
                setClaimingId(null);
                return;
            }

            // Check if another driver claimed it first
            if (
                latestOrder.delivery_person_id &&
                latestOrder.delivery_person_id !== activeDriverId
            ) {
                toast.error("Dalabkan waxaa hore u qaaday wadaha kale!", {
                    icon: <ShieldAlert className="h-5 w-5 text-rose-600" />,
                    duration: 4000,
                });
                loadOrders(); // Refresh pool
                setClaimingId(null);
                return;
            }

            // Step 2: Atomic Update to claim order
            const nowIso = new Date().toISOString();
            const { error: updateError } = await supabase
                .from("orders")
                .update({
                    delivery_person_id: activeDriverId,
                    status: "outForDelivery",
                    picked_up_at: nowIso,
                })
                .eq("id", order.id)
                .is("delivery_person_id", null); // DB-level lock guard

            if (updateError) {
                toast.error("Dalabkan waxaa hore u qaaday wadaha kale!", {
                    icon: <ShieldAlert className="h-5 w-5 text-rose-600" />,
                });
                loadOrders();
                setClaimingId(null);
                return;
            }

            toast.success(
                "Waa ku guulaysatay! Dalabka waxaa laguugu saaray magacaaga.",
                { icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" /> }
            );

            loadOrders();
        } catch (err: any) {
            toast.error(err?.message || "Cilad ayaa dhacday");
        } finally {
            setClaimingId(null);
        }
    };

    /**
     * Mark Order as Delivered
     */
    const handleMarkDelivered = async (orderId: string) => {
        setDeliveringId(orderId);
        try {
            const { error } = await supabase
                .from("orders")
                .update({
                    status: "delivered",
                    delivered_at: new Date().toISOString(),
                })
                .eq("id", orderId);

            if (error) {
                toast.error(error.message);
            } else {
                toast.success("Alaabta waa la gaarsiiyay macmiilka!");
                loadOrders();
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setDeliveringId(null);
        }
    };

    /**
     * Driver Release / Cancel Delivery
     */
    const handleCancelDelivery = async (order: Order) => {
        if (!confirm(`Ma hubtaa inaad fasaxayso/kansalayso gaarsiinta dalabka #${order.id.slice(0, 8)}?`)) {
            return;
        }

        setCancellingId(order.id);
        try {
            const { error } = await supabase
                .from("orders")
                .update({
                    delivery_person_id: null,
                    status: "approved",
                    cancelled_by_driver_name: activeDriverName || "Wada",
                    driver_cancelled_at: new Date().toISOString(),
                })
                .eq("id", order.id);

            if (error) {
                toast.error(error.message);
            } else {
                toast.warning(`Waa la fasaxay gaarsiinta dalabka #${order.id.slice(0, 8)}. Admin-ka iyo wadayaasha kale waa lagu wargeliyay.`, {
                    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
                });
                loadOrders();
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100/70 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b bg-white shadow-sm px-4 py-3">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo compact />
                        <Badge className="bg-emerald-500 text-white font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5" /> Delivery Pool
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Driver switch selector for demo testing */}
                        {deliveryDrivers.length > 0 && (
                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs">
                                <span className="font-semibold text-slate-500 pl-2">Wadaha:</span>
                                <select
                                    value={activeDriverId}
                                    onChange={(e) => {
                                        const found = deliveryDrivers.find((d) => d.id === e.target.value);
                                        if (found) {
                                            setActiveDriverId(found.id);
                                            setActiveDriverName(found.name);
                                        }
                                    }}
                                    className="bg-white border-0 font-bold text-slate-800 rounded-lg px-2 py-1 focus:ring-1 focus:ring-primary shadow-xs"
                                >
                                    {deliveryDrivers.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name} ({d.phone || "No phone"})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadOrders}
                            className="text-xs font-semibold gap-1"
                        >
                            <RefreshCw className="h-3.5 w-3.5" /> Soo Cusboonaysii
                        </Button>

                        {user && (
                            <Button variant="ghost" size="sm" onClick={logout} className="text-xs text-rose-600">
                                Log out
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Container */}
            <main className="mx-auto max-w-6xl px-4 pt-6 space-y-6">
                {/* Driver Welcome Banner */}
                <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg rounded-3xl overflow-hidden">
                    <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                                    Real-time Delivery Pool
                                </span>
                                <span className="text-xs text-slate-300 flex items-center gap-1">
                                    <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> First-Come, First-Served
                                </span>
                            </div>
                            <h1 className="text-2xl font-black text-white">
                                Kusoo dhawaow, {activeDriverName}! 👋
                            </h1>
                            <p className="text-xs text-slate-300">
                                Dalabyada furan halkan ayaad ka qaadan kartaa. Wadaha ugu horreeya ee doorada ayaa loo saarayaa.
                            </p>
                        </div>

                        {/* Live Counter Badges */}
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center min-w-[90px] border border-white/10">
                                <p className="text-2xl font-black text-emerald-400">{openPoolOrders.length}</p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase">Dalabyo Furan</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center min-w-[90px] border border-white/10">
                                <p className="text-2xl font-black text-amber-400">{myActiveDeliveries.length}</p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase">Gaarsiintaada</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs for Order Pools */}
                <Tabs defaultValue="open-pool" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-white p-1.5 rounded-2xl border shadow-xs">
                        <TabsTrigger
                            value="open-pool"
                            className="rounded-xl font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 flex items-center justify-center gap-1.5"
                        >
                            <PackageCheck className="h-4 w-4" />
                            📦 Dalabyo furan (qaad adigu)
                            <Badge className="ml-1 bg-amber-500 text-white font-extrabold text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full">
                                {openPoolOrders.length}
                            </Badge>
                        </TabsTrigger>

                        <TabsTrigger
                            value="my-active"
                            className="rounded-xl font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 flex items-center justify-center gap-1.5"
                        >
                            <Truck className="h-4 w-4" />
                            🚚 Gaarsi macmiilka
                            <Badge className="ml-1 bg-indigo-600 text-white font-extrabold text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full">
                                {myActiveDeliveries.length}
                            </Badge>
                        </TabsTrigger>

                        <TabsTrigger
                            value="my-completed"
                            className="rounded-xl font-bold text-xs data-[state=active]:bg-primary data-[state=active]:text-white py-2.5 flex items-center justify-center gap-1.5"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            ✅ Dalabyadii hore ({myCompletedDeliveries.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* OPEN POOL CONTENT */}
                    <TabsContent value="open-pool" className="pt-4 space-y-4">
                        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                <span>
                                    <strong>First-Come, First-Served:</strong> Dalabyada hoose lacagtooda waa la bixiyay (<strong>isPaid: true</strong>). Qofkii ugu horreeya ee taaba <strong>"Qaado alaabta"</strong> ayaa loo magacaabayaa.
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <Skeleton className="h-48 w-full rounded-2xl" />
                        ) : openPoolOrders.length === 0 ? (
                            <Card className="text-center p-12 border-dashed bg-white rounded-3xl">
                                <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                <p className="font-bold text-slate-700 text-base">Waqtigan dalabyo furan ma jiraan</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Marka macmiilku EVC Plus ku bixiyo lacagta, dalabku toos wuxuu ugu soo dhacayaa qaybtan.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {openPoolOrders.map((order) => (
                                    <Card
                                        key={order.id}
                                        className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white rounded-3xl overflow-hidden"
                                    >
                                        <CardHeader className="bg-slate-50/60 pb-3 border-b">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-slate-400 font-mono">
                                                        #{order.id.slice(0, 8)}
                                                    </p>
                                                    <CardTitle className="text-base font-extrabold text-slate-900 mt-0.5">
                                                        {formatCurrency(order.total_amount)}
                                                    </CardTitle>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <OrderStatusBadge status={order.status} />
                                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                                        ✓ PAID
                                                    </span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-4">
                                            {/* Customer Details */}
                                            <div className="rounded-2xl bg-slate-50 p-3 space-y-2 text-xs border border-slate-100">
                                                <div className="flex items-center gap-2 font-bold text-slate-800">
                                                    <User className="h-4 w-4 text-primary shrink-0" />
                                                    <span>Macmiilka: {order.customer_name || "Macmiil"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                                                    <span className="font-mono">{order.customer_phone || "No phone"}</span>
                                                </div>
                                                <div className="flex items-start gap-2 text-slate-600">
                                                    <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                                    <span>{order.customer_address || "Cinwaan la cayimin"}</span>
                                                </div>
                                            </div>

                                            {/* Items */}
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase">Alaabta ({order.items?.length || 0})</p>
                                                <div className="text-xs font-medium text-slate-700 space-y-1">
                                                    {order.items?.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between">
                                                            <span>• {item.productName} (x{item.quantity})</span>
                                                            <span className="text-slate-400">{item.storeName}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => handleClaimOrder(order)}
                                                disabled={claimingId === order.id}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-11 rounded-2xl shadow-md shadow-emerald-600/20"
                                            >
                                                {claimingId === order.id ? (
                                                    "Qaadaya..."
                                                ) : (
                                                    <>
                                                        <PackageCheck className="mr-2 h-4 w-4" />
                                                        Qaado alaabta (Claim Order)
                                                    </>
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* MY ACTIVE DELIVERIES CONTENT */}
                    <TabsContent value="my-active" className="pt-4 space-y-4">
                        {loading ? (
                            <Skeleton className="h-48 w-full rounded-2xl" />
                        ) : myActiveDeliveries.length === 0 ? (
                            <Card className="text-center p-12 border-dashed bg-white rounded-3xl">
                                <Truck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                <p className="font-bold text-slate-700 text-base">Kuma jiraan dalabyo aad haatan gaarsiinayso</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Ka qaado dalabyada furan qaybta <strong>"📦 Dalabyo furan"</strong>.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {myActiveDeliveries.map((order) => (
                                    <Card
                                        key={order.id}
                                        className="border-indigo-200 shadow-md bg-white rounded-3xl overflow-hidden"
                                    >
                                        <CardHeader className="bg-indigo-50/50 pb-3 border-b border-indigo-100">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-indigo-500 font-mono">
                                                        #{order.id.slice(0, 8)}
                                                    </p>
                                                    <CardTitle className="text-base font-extrabold text-slate-900 mt-0.5">
                                                        {formatCurrency(order.total_amount)}
                                                    </CardTitle>
                                                </div>
                                                <OrderStatusBadge status={order.status} />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-4">
                                            {/* Customer Details & Call Button */}
                                            <div className="rounded-2xl bg-slate-50 p-4 space-y-3 border text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {order.customer_name}
                                                    </span>
                                                    <a
                                                        href={`tel:${order.customer_phone}`}
                                                        className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs hover:bg-emerald-700"
                                                    >
                                                        <Phone className="h-3.5 w-3.5" /> Wac Macmiilka
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600 font-mono">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{order.customer_phone}</span>
                                                </div>
                                                <div className="flex items-start gap-2 text-slate-600">
                                                    <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                                    <span className="font-medium text-slate-800">
                                                        {order.customer_address || "Mogadishu, Somalia"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Picked up timestamp */}
                                            {order.picked_up_at && (
                                                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>Wadaha qaaday: {formatDate(order.picked_up_at)}</span>
                                                </div>
                                            )}

                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <Button
                                                    onClick={() => handleMarkDelivered(order.id)}
                                                    disabled={deliveringId === order.id || cancellingId === order.id}
                                                    className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold h-11 rounded-2xl shadow-md"
                                                >
                                                    {deliveringId === order.id ? (
                                                        "Dhiibaya..."
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            Dhiib Alaabta
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => handleCancelDelivery(order)}
                                                    disabled={deliveringId === order.id || cancellingId === order.id}
                                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-extrabold h-11 rounded-2xl gap-1.5"
                                                >
                                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                                    {cancellingId === order.id ? "Fasaxaya..." : "Fasax Gaarsiinta"}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* MY COMPLETED DELIVERIES CONTENT */}
                    <TabsContent value="my-completed" className="pt-4">
                        {myCompletedDeliveries.length === 0 ? (
                            <Card className="text-center p-12 border-dashed bg-white rounded-3xl">
                                <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                <p className="font-bold text-slate-700 text-base">Waqtigan wax dalabyo ah oo aad dhiibtay ma jiraan</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {myCompletedDeliveries.map((order) => (
                                    <Card key={order.id} className="p-4 bg-white rounded-2xl border flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-mono font-bold text-slate-600">#{order.id.slice(0, 8)}</span>
                                            <p className="font-bold text-slate-900 text-sm mt-0.5">{order.customer_name} ({order.customer_phone})</p>
                                            <p className="text-slate-400">{order.customer_address}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-extrabold text-sm text-primary">{formatCurrency(order.total_amount)}</p>
                                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold mt-1">
                                                DELIVERED
                                            </Badge>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
