"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import type { Store, Product, Order, OrderStatus } from "@/lib/types";
import { formatCurrency, generateId } from "@/lib/utils";
import { POSOrderModal } from "@/components/restaurant/POSOrderModal";
import { DualImageInput } from "@/components/dual-image-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    Utensils,
    Plus,
    Tag,
    ShoppingBag,
    DollarSign,
    Clock,
    CheckCircle,
    CheckCircle2,
    Truck,
    Edit2,
    Trash2,
    Package,
    Sparkles,
    Flame,
    Zap,
    TrendingUp,
    Store as StoreIcon,
    ChefHat,
    Search,
    Filter,
    X,
    RotateCcw,
    ArrowUpDown,
} from "lucide-react";

export default function RestaurantDashboardPage() {
    const { user } = useAuth();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // POS Modal State
    const [posModalOpen, setPosModalOpen] = useState(false);

    // Add/Edit Menu Item Modal State
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Product | null>(null);
    const [submittingItem, setSubmittingItem] = useState(false);

    // Menu Tab Search & Filter State
    const [menuSearch, setMenuSearch] = useState("");
    const [menuFilter, setMenuFilter] = useState<"all" | "discount" | "instock" | "outstock">("all");

    // Orders Tab Search & Filter State
    const [orderSearch, setOrderSearch] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
    const [orderFulfillmentFilter, setOrderFulfillmentFilter] = useState<string>("all");

    const [itemForm, setItemForm] = useState({
        name: "",
        price: "",
        originalPrice: "",
        stock: "100",
        image: "",
        description: "",
    });

    const loadData = useCallback(async () => {
        const u = user;
        if (!u?.id) return;
        setLoading(true);

        try {
            let myStore: Store | null = null;

            if (u.store_id) {
                const { data: storeByProfile } = await supabase
                    .from("stores")
                    .select("*")
                    .eq("id", u.store_id)
                    .maybeSingle();
                if (storeByProfile) {
                    myStore = storeByProfile as Store;
                }
            }

            if (!myStore) {
                const { data: storeByOwner } = await supabase
                    .from("stores")
                    .select("*")
                    .eq("owner_id", u.id)
                    .limit(1);
                if (storeByOwner && storeByOwner.length > 0) {
                    myStore = storeByOwner[0] as Store;
                }
            }

            if (!myStore) {
                const { data: fallbackStores } = await supabase
                    .from("stores")
                    .select("*")
                    .eq("is_restaurant", true)
                    .limit(1);
                myStore = (fallbackStores?.[0] as Store) || null;
            }

            setStore(myStore);

            if (myStore) {
                const [productsRes, ordersRes] = await Promise.all([
                    supabase.from("products").select("*").eq("store_id", myStore.id),
                    supabase.from("orders").select("*").eq("store_id", myStore.id),
                ]);

                const storeProducts = (productsRes.data as Product[]) || [];
                const storeOrders = (ordersRes.data as Order[]) || [];

                setProducts(storeProducts);
                setOrders(storeOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            }
        } catch (err) {
            console.error("Fast load error:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();

        const channel = supabase
            .channel("restaurant_orders_live_dashboard")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                () => {
                    loadData();
                    toast.success("🔔 Order update mpya ayaa soo dhacday!");
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadData]);

    const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", orderId);

            if (error) {
                toast.error(`Cilad ayaa dhacday: ${error.message}`);
            } else {
                toast.success(
                    newStatus === "approved"
                        ? "✅ Dalabka waa la aqbalay! Qaybta karinta ayaad u gudbisay."
                        : newStatus === "delivered"
                            ? "🎉 Dalabka waa la dhameystiray!"
                            : `Status-ka dalabka waxaa loo baddalay ${newStatus}`
                );
                loadData();
            }
        } catch (err: any) {
            toast.error(err?.message || "Cilad ayaa dhacday");
        }
    };

    const handleOpenItemModal = (item?: Product) => {
        if (item) {
            setEditingItem(item);
            setItemForm({
                name: item.name,
                price: item.price.toString(),
                originalPrice: item.original_price ? item.original_price.toString() : "",
                stock: item.stock.toString(),
                image: item.image,
                description: item.description || "",
            });
        } else {
            setEditingItem(null);
            setItemForm({
                name: "",
                price: "",
                originalPrice: "",
                stock: "100",
                image: "",
                description: "",
            });
        }
        setItemModalOpen(true);
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!store) {
            toast.error("Restaurant store configuration strictly required");
            return;
        }

        const priceNum = parseFloat(itemForm.price);
        const origPriceNum = itemForm.originalPrice ? parseFloat(itemForm.originalPrice) : null;
        const stockNum = parseInt(itemForm.stock, 10) || 0;

        if (isNaN(priceNum) || priceNum <= 0) {
            toast.error("Fadlan geli qiimo sax ah");
            return;
        }

        setSubmittingItem(true);

        try {
            if (editingItem) {
                const { error } = await supabase
                    .from("products")
                    .update({
                        name: itemForm.name,
                        price: priceNum,
                        original_price: origPriceNum,
                        stock: stockNum,
                        image: itemForm.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
                        description: itemForm.description,
                    })
                    .eq("id", editingItem.id);

                if (error) toast.error(error.message);
                else {
                    toast.success("✅ Cuntada waa la cusbooneysiiyay");
                    setItemModalOpen(false);
                    loadData();
                }
            } else {
                const id = generateId();
                const { error } = await supabase.from("products").insert({
                    id,
                    name: itemForm.name,
                    description: itemForm.description,
                    price: priceNum,
                    original_price: origPriceNum,
                    stock: stockNum,
                    image: itemForm.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
                    images: [itemForm.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300"],
                    video_url: null,
                    category_id: "food",
                    store_id: store.id,
                    store_name: store.name,
                    rating: 5,
                    is_approved: true,
                });

                if (error) toast.error(error.message);
                else {
                    toast.success("✅ Cunto cusub waa lagu daray Menu-ga");
                    setItemModalOpen(false);
                    loadData();
                }
            }
        } catch {
            toast.error("Cillad ayaa dhacday marka la kaydinayay cuntada");
        } finally {
            setSubmittingItem(false);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Ma cinwaansan tahay inaad tirtirto cuntadan?")) return;
        try {
            const { error } = await supabase.from("products").delete().eq("id", itemId);
            if (error) toast.error(error.message);
            else {
                toast.success("Cuntada waa la tirtiray");
                loadData();
            }
        } catch {
            toast.error("Cillad ayaa dhacday marka la tirtirayay");
        }
    };

    // Stats calculation
    const totalRevenue = orders
        .filter((o) => o.is_paid)
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const pendingOrdersCount = orders.filter((o) => o.status === "pending" || o.status === "approved").length;

    // Filtered Products for Menu Tab
    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(menuSearch.toLowerCase().trim());
        const origPrice = Number(p.original_price || (p as any).originalPrice || 0);
        const currentPrice = Number(p.price);
        const hasDiscount = origPrice > currentPrice;

        let matchesFilter = true;
        if (menuFilter === "discount") matchesFilter = hasDiscount;
        else if (menuFilter === "instock") matchesFilter = p.stock > 0;
        else if (menuFilter === "outstock") matchesFilter = p.stock <= 0;

        return matchesSearch && matchesFilter;
    });

    // Filtered Orders for Live Orders Tab
    const filteredOrders = orders.filter((o) => {
        const query = orderSearch.toLowerCase().trim();
        const matchesQuery =
            !query ||
            o.id.toLowerCase().includes(query) ||
            (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
            (o.customer_phone && o.customer_phone.toLowerCase().includes(query)) ||
            (o.customer_address && o.customer_address.toLowerCase().includes(query));

        let matchesStatus = true;
        if (orderStatusFilter === "pending") matchesStatus = o.status === "pending" || o.status === "paymentConfirmed";
        else if (orderStatusFilter === "approved") matchesStatus = o.status === "approved";
        else if (orderStatusFilter === "outForDelivery") matchesStatus = o.status === "outForDelivery";
        else if (orderStatusFilter === "delivered") matchesStatus = o.status === "delivered";

        let matchesFulfillment = true;
        if (orderFulfillmentFilter === "pickup") matchesFulfillment = o.fulfillment_type === "pickup";
        else if (orderFulfillmentFilter === "delivery") matchesFulfillment = o.fulfillment_type !== "pickup";

        return matchesQuery && matchesStatus && matchesFulfillment;
    });

    return (
        <div className="space-y-6">
            {/* Top Glassmorphic Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 border border-rose-500/20 p-6 md:p-8 text-white shadow-2xl">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-black text-rose-300 border border-rose-500/30">
                            <Flame className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                            <span>RESTAURANT COMMAND CENTER</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3 text-white">
                            {store ? store.name : "Restaurant POS Dashboard"}
                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5">
                                ● ONLINE
                            </Badge>
                        </h1>
                        <p className="text-xs md:text-sm text-slate-300 max-w-xl">
                            Maamul Menu-yada cuntada, Qiimo dhimista (Discounts), Dalabyada Real-Time-ka ah, iyo Fast POS Manual Orders.
                        </p>
                    </div>

                    <Button
                        onClick={() => setPosModalOpen(true)}
                        size="lg"
                        className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-sm px-8 py-7 rounded-2xl shadow-xl shadow-rose-600/30 border border-rose-400/30 shrink-0 gap-2.5 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="h-6 w-6 stroke-[3]" />
                        <span>+ Samee Dalab POS (Manual)</span>
                    </Button>
                </div>

                <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-md shadow-lg rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400">Total Food Revenue</p>
                            <h3 className="text-2xl font-black text-white mt-1">
                                {formatCurrency(totalRevenue)}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">+12.5% from last week</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 shadow-inner">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-md shadow-lg rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">Active Live Orders</p>
                            <h3 className="text-2xl font-black text-white mt-1">
                                {orders.length} Orders
                            </h3>
                            <p className="text-[10px] text-amber-300/80 mt-0.5">{pendingOrdersCount} preparing / pending</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
                            <Clock className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-md shadow-lg rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400">Menu Items Count</p>
                            <h3 className="text-2xl font-black text-white mt-1">
                                {products.length} Items
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Active food list</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
                            <ChefHat className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-md shadow-lg rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">POS Direct Orders</p>
                            <h3 className="text-2xl font-black text-white mt-1">
                                {orders.filter((o) => o.is_pos_order).length} Orders
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Manual counter entries</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
                            <Zap className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs Container */}
            <Tabs defaultValue="menu" className="w-full space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <TabsList className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl grid grid-cols-2 w-full sm:w-auto">
                        <TabsTrigger
                            value="menu"
                            className="rounded-xl font-extrabold text-xs px-6 py-2.5 text-slate-400 data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all"
                        >
                            <Utensils className="h-4 w-4 mr-2" />
                            1. Menu Manager ({filteredProducts.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="orders"
                            className="rounded-xl font-extrabold text-xs px-6 py-2.5 text-slate-400 data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all"
                        >
                            <Clock className="h-4 w-4 mr-2" />
                            2. Live Orders Stream ({filteredOrders.length})
                        </TabsTrigger>
                    </TabsList>

                    <Button
                        onClick={() => handleOpenItemModal()}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs gap-2 py-5"
                    >
                        <Plus className="h-4 w-4" /> Ku dar Cunto Cusub Menu-ga
                    </Button>
                </div>

                {/* Tab 1: Menu & Discount Manager */}
                <TabsContent value="menu" className="space-y-4">
                    {/* Menu Search & Filter Toolbar */}
                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Raadi cunto..."
                                    value={menuSearch}
                                    onChange={(e) => setMenuSearch(e.target.value)}
                                    className="pl-10 pr-9 bg-slate-950 border-slate-800 text-white rounded-xl text-xs h-10"
                                />
                                {menuSearch && (
                                    <button
                                        onClick={() => setMenuSearch("")}
                                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => setMenuFilter("all")}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${menuFilter === "all"
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800"
                                        }`}
                                >
                                    All ({products.length})
                                </button>
                                <button
                                    onClick={() => setMenuFilter("discount")}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${menuFilter === "discount"
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-950 text-rose-400 hover:bg-slate-800 border border-slate-800"
                                        }`}
                                >
                                    <Tag className="h-3 w-3" /> 🔥 Qiimo Dhimis
                                </button>
                                <button
                                    onClick={() => setMenuFilter("instock")}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${menuFilter === "instock"
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800"
                                        }`}
                                >
                                    ✅ In Stock
                                </button>
                                <button
                                    onClick={() => setMenuFilter("outstock")}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${menuFilter === "outstock"
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800"
                                        }`}
                                >
                                    ❌ Out of Stock
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Skeleton className="h-52 w-full rounded-2xl bg-slate-800/60" />
                            <Skeleton className="h-52 w-full rounded-2xl bg-slate-800/60" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <Card className="p-12 text-center border-slate-800 bg-slate-900/40 rounded-3xl">
                            <Utensils className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                            <p className="font-bold text-slate-300 text-base">Cunto la helin</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredProducts.map((item) => {
                                const origPrice = Number(item.original_price || (item as any).originalPrice || 0);
                                const currentPrice = Number(item.price);
                                const hasDiscount = origPrice > currentPrice;
                                const discountPercent = hasDiscount
                                    ? Math.round(((origPrice - currentPrice) / origPrice) * 100)
                                    : 0;

                                return (
                                    <Card
                                        key={item.id}
                                        className="overflow-hidden border-slate-800/80 bg-slate-900/90 shadow-md rounded-2xl flex flex-col justify-between hover:border-rose-500/40 transition-all"
                                    >
                                        <div>
                                            <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                                                <img
                                                    src={item.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                                {hasDiscount && (
                                                    <span className="absolute top-3 right-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black text-xs px-2.5 py-1 shadow-lg flex items-center gap-1">
                                                        <Sparkles className="h-3 w-3" /> {discountPercent}% OFF
                                                    </span>
                                                )}
                                                {item.stock <= 0 && (
                                                    <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center">
                                                        <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                                                            Out of Stock
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <CardContent className="p-4 space-y-2">
                                                <h3 className="font-extrabold text-white text-base">{item.name}</h3>
                                                <p className="text-xs text-slate-400 line-clamp-2">
                                                    {item.description || "Freshly prepared meal."}
                                                </p>

                                                <div className="flex items-baseline gap-2 pt-1">
                                                    <span className="text-xl font-black text-rose-400">
                                                        {formatCurrency(currentPrice)}
                                                    </span>
                                                    {hasDiscount && (
                                                        <span className="text-xs text-slate-500 line-through font-medium">
                                                            {formatCurrency(origPrice)}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs font-bold text-slate-400">
                                                    Stock Counter: <span className="text-white font-extrabold">{item.stock}</span>
                                                </p>
                                            </CardContent>
                                        </div>

                                        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenItemModal(item)}
                                                className="h-9 rounded-xl text-xs gap-1.5 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" /> Wax ka baddi
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="h-9 rounded-xl text-xs bg-rose-600/80 hover:bg-rose-600 text-white"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Tab 2: Live Orders Stream */}
                <TabsContent value="orders" className="space-y-4">
                    {/* Orders Search & Filter Toolbar */}
                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Raadi Order #, Macmiilka, Taleefan..."
                                    value={orderSearch}
                                    onChange={(e) => setOrderSearch(e.target.value)}
                                    className="pl-10 pr-9 bg-slate-950 border-slate-800 text-white rounded-xl text-xs h-10"
                                />
                                {orderSearch && (
                                    <button
                                        onClick={() => setOrderSearch("")}
                                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                                    <select
                                        value={orderStatusFilter}
                                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                                        className="bg-transparent font-extrabold text-white outline-hidden cursor-pointer"
                                    >
                                        <option value="all">Dhammaan Statuses</option>
                                        <option value="pending">⏳ Pending</option>
                                        <option value="approved">👨‍🍳 Preparing</option>
                                        <option value="outForDelivery">🚚 Driver Picked Up</option>
                                        <option value="delivered">✅ Delivered</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                                    <Truck className="h-3.5 w-3.5 text-blue-400" />
                                    <select
                                        value={orderFulfillmentFilter}
                                        onChange={(e) => setOrderFulfillmentFilter(e.target.value)}
                                        className="bg-transparent font-extrabold text-white outline-hidden cursor-pointer"
                                    >
                                        <option value="all">Dhammaan Types</option>
                                        <option value="pickup">🚶‍♂️ Pickup</option>
                                        <option value="delivery">🚚 Delivery</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {filteredOrders.length === 0 ? (
                        <Card className="p-12 text-center border-slate-800 bg-slate-900/40 rounded-3xl">
                            <ShoppingBag className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                            <p className="font-bold text-slate-300 text-base">Dalab lama helin</p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
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
                                    <Card key={o.id} className="border-slate-800 bg-slate-900/90 rounded-2xl p-5">
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
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Amount</p>
                                                <p className="text-xl font-black text-rose-400">
                                                    {formatCurrency(Number(o.total_amount))}
                                                </p>
                                                <span className="text-[10px] font-bold text-emerald-400">
                                                    {o.payment_method?.toUpperCase()} (PAID)
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <p className="text-xs font-bold text-slate-400">
                                                Cuntooyinka la dalbaday ({o.items?.length || 0}):
                                            </p>
                                            <div className="grid gap-2.5 sm:grid-cols-2">
                                                {o.items?.map((it, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5"
                                                    >
                                                        <img
                                                            src={it.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150"}
                                                            alt={it.productName}
                                                            className="h-12 w-12 rounded-lg object-cover border border-slate-800 shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-white truncate">
                                                                {it.productName}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-medium">
                                                                <span>{formatCurrency(Number(it.price))}</span>
                                                                <span className="bg-rose-950/80 text-rose-300 border border-rose-800/60 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                                                                    x{it.quantity}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-xs font-black text-emerald-400 font-mono">
                                                                {formatCurrency(Number(it.price) * it.quantity)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Status Update Action Buttons */}
                                        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
                                            {o.status === "pending" && (
                                                <Button
                                                    onClick={() => handleUpdateOrderStatus(o.id, "approved")}
                                                    className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl px-4 py-2"
                                                >
                                                    <ChefHat className="h-3.5 w-3.5 mr-1" /> Aqbbal & Karinta billaw
                                                </Button>
                                            )}
                                            {o.status === "approved" && (
                                                <Button
                                                    onClick={() => handleUpdateOrderStatus(o.id, "delivered")}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl px-4 py-2"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Rasmey Dhameystirka
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* POS Direct Order Modal Component */}
            <POSOrderModal
                open={posModalOpen}
                onOpenChange={setPosModalOpen}
                products={products}
                restaurantStoreId={store?.id || ""}
                restaurantStoreName={store?.name || "Restaurant"}
                onOrderCreated={() => {
                    loadData();
                    toast.success("✅ POS Direct Order waa la rasmeyay!");
                }}
            />

            {/* Add / Edit Dish Modal */}
            <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
                <DialogContent className="max-w-md rounded-3xl p-6 bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-white">
                            {editingItem ? "Wax ka baddi Cuntada Menu-ga" : "Ku dar Cunto Cusub Menu-ga"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-400">
                            Geli xogta cuntada sida magaca, qiimaha, iyo qiimo dhimista.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveItem} className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-300">Magaca Cuntada</Label>
                            <Input
                                required
                                placeholder="E.g. Special Chicken Burger"
                                value={itemForm.name}
                                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                className="bg-slate-950 border-slate-800 rounded-xl text-xs text-white"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-300">Faahfaahinta Cuntada (Description)</Label>
                            <Textarea
                                placeholder="E.g. Burger fesh ah oo leh cheese iyo suugo macaan..."
                                value={itemForm.description}
                                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                className="bg-slate-950 border-slate-800 rounded-xl text-xs text-white min-h-[80px]"
                            />
                        </div>

                        <div className="grid gap-3 grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-rose-400">Discount Price ($)</Label>
                                <Input
                                    required
                                    type="number"
                                    step="0.01"
                                    placeholder="7.50"
                                    value={itemForm.price}
                                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                                    className="bg-slate-950 border-slate-800 rounded-xl text-xs text-white font-bold"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-400">Original Price ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="10.00"
                                    value={itemForm.originalPrice}
                                    onChange={(e) => setItemForm({ ...itemForm, originalPrice: e.target.value })}
                                    className="bg-slate-950 border-slate-800 rounded-xl text-xs text-white"
                                />
                            </div>
                        </div>

                        <DualImageInput
                            label="Sawirka Cuntada (Dish Image)"
                            value={itemForm.image}
                            onChange={(url) => setItemForm({ ...itemForm, image: url })}
                        />

                        <Button
                            type="submit"
                            disabled={submittingItem}
                            className="w-full bg-rose-600 text-white font-bold rounded-xl py-5 text-xs"
                        >
                            {submittingItem ? "Saving..." : "Kaydi Menu-ga"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
