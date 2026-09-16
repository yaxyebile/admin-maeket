"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import type { Store, Product, OrderItem, PaymentMethod } from "@/lib/types";
import { formatCurrency, generateId } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
    Utensils,
    Plus,
    Minus,
    ShoppingCart,
    User,
    Phone,
    MapPin,
    CreditCard,
    CheckCircle2,
    Loader2,
    Search,
    X,
    Tag,
    Filter,
} from "lucide-react";

export default function RestaurantPOSPage() {
    const { user } = useAuth();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("evcPlus");
    const [submitting, setSubmitting] = useState(false);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [posFilter, setPosFilter] = useState<"all" | "discount" | "instock">("all");

    const loadData = useCallback(async () => {
        const [storesRes, productsRes] = await Promise.all([
            supabase.from("stores").select("*"),
            supabase.from("products").select("*"),
        ]);

        const allStores = (storesRes.data as Store[]) ?? [];
        const allProducts = (productsRes.data as Product[]) ?? [];

        let myStore = allStores.find((s) => s.owner_id === user?.id && (s.is_restaurant || s.name.toLowerCase().includes("restaurant")));
        if (!myStore && allStores.length > 0) {
            myStore = allStores.find((s) => s.is_restaurant) || allStores[0];
        }

        setStore(myStore || null);

        if (myStore) {
            setProducts(allProducts.filter((p) => p.store_id === myStore.id));
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleQuantityChange = (productId: string, delta: number) => {
        setQuantities((prev) => {
            const current = prev[productId] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [productId]: next };
        });
    };

    const selectedItems: OrderItem[] = products
        .filter((p) => (quantities[p.id] || 0) > 0)
        .map((p) => ({
            productId: p.id,
            productName: p.name,
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : null,
            quantity: quantities[p.id] || 0,
            storeId: store?.id || "",
            storeName: store?.name || "Restaurant",
            image: p.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150",
        }));

    const totalAmount = selectedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const handleSubmitPOSOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!store) {
            toast.error("Restaurant store required");
            return;
        }
        if (selectedItems.length === 0) {
            toast.error("Fadlan dooro ugu yaraan hal nooc oo cunto ah");
            return;
        }
        if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
            toast.error("Fadlan buuxi magaca, taleefanka, iyo cinwaanka macmiilka");
            return;
        }

        setSubmitting(true);
        const orderId = generateId();

        try {
            const { error } = await supabase.from("orders").insert({
                id: orderId,
                user_id: "pos_direct_customer",
                items: selectedItems,
                total_amount: totalAmount,
                date: new Date().toISOString(),
                status: "approved",
                store_id: store.id,
                payment_method: paymentMethod,
                is_paid: true,
                customer_name: customerName.trim(),
                customer_phone: customerPhone.trim(),
                customer_address: customerAddress.trim(),
                is_pos_order: true,
            });

            if (error) {
                toast.error(`Error: ${error.message}`);
            } else {
                toast.success("✅ POS Order-ka waa la rasmeyay oo wuxuu toos ugu galay Delivery Pool-ka!");
                setQuantities({});
                setCustomerName("");
                setCustomerPhone("");
                setCustomerAddress("");
            }
        } catch {
            toast.error("Cillad ayaa dhacday marka la abuurayay dalabka");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
        const origPrice = Number(p.original_price || (p as any).originalPrice || 0);
        const currentPrice = Number(p.price);
        const hasDiscount = origPrice > currentPrice;

        let matchesFilter = true;
        if (posFilter === "discount") matchesFilter = hasDiscount;
        else if (posFilter === "instock") matchesFilter = p.stock > 0;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-900 to-rose-700 p-6 rounded-3xl text-white shadow-xl">
                <div>
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                        DIRECT POS TERMINAL
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black mt-2">
                        Samee Dalab Toos ah (POS Order Terminal)
                    </h1>
                    <p className="text-xs text-rose-100 mt-1">
                        U samee dalab toos ah macmiilka goobta jooga ama taleefanka ka soo dalbanaya.
                    </p>
                </div>
            </div>

            {/* POS Terminal Grid */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column: Food Selection & Search/Filtering */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Raadi cunto..."
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
                        </div>

                        {/* Quick Filters */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPosFilter("all")}
                                    className={`px-3 py-1 rounded-lg font-bold transition-all ${posFilter === "all"
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800"
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setPosFilter("discount")}
                                    className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${posFilter === "discount"
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-950 text-rose-400 hover:bg-slate-800 border border-slate-800"
                                        }`}
                                >
                                    <Tag className="h-3 w-3" /> 🔥 Discounts
                                </button>
                                <button
                                    onClick={() => setPosFilter("instock")}
                                    className={`px-3 py-1 rounded-lg font-bold transition-all ${posFilter === "instock"
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800"
                                        }`}
                                >
                                    ✅ In Stock
                                </button>
                            </div>
                            <span className="text-slate-400 font-medium">
                                <strong>{filteredProducts.length}</strong> items available
                            </span>
                        </div>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <Card className="p-8 text-center border-slate-800 bg-slate-900/40 rounded-2xl">
                            <Utensils className="mx-auto h-10 w-10 text-slate-600 mb-2" />
                            <p className="font-bold text-slate-300 text-xs">Cunto la helin</p>
                        </Card>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 max-h-[600px] overflow-y-auto pr-1">
                            {filteredProducts.map((item) => {
                                const qty = quantities[item.id] || 0;
                                const isOutOfStock = item.stock <= 0;
                                const origPrice = Number(item.original_price || (item as any).originalPrice || 0);
                                const currentPrice = Number(item.price);
                                const hasDiscount = origPrice > currentPrice;

                                return (
                                    <Card
                                        key={item.id}
                                        className={`border transition-all ${qty > 0
                                            ? "border-rose-500 bg-rose-950/20 shadow-md"
                                            : "border-slate-800 bg-slate-900/90"
                                            }`}
                                    >
                                        <CardContent className="p-3.5 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={item.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150"}
                                                    alt={item.name}
                                                    className="h-12 w-12 rounded-xl object-cover border border-slate-800 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-extrabold text-white text-xs truncate">
                                                        {item.name}
                                                    </p>
                                                    <div className="flex items-baseline gap-1.5 mt-0.5">
                                                        <span className="text-sm font-black text-rose-400">
                                                            {formatCurrency(currentPrice)}
                                                        </span>
                                                        {hasDiscount && (
                                                            <span className="text-[10px] text-slate-500 line-through">
                                                                {formatCurrency(origPrice)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quantity Control Buttons */}
                                            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, -1)}
                                                    disabled={qty === 0}
                                                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-5 text-center font-extrabold text-white text-xs">
                                                    {qty}
                                                </span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, 1)}
                                                    disabled={isOutOfStock}
                                                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-rose-600 text-white disabled:opacity-30 hover:bg-rose-500"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column: Order Summary & Customer Info */}
                <div className="lg:col-span-5">
                    <Card className="border-slate-800 bg-slate-900 text-white shadow-xl rounded-2xl sticky top-6">
                        <CardHeader className="border-b border-slate-800 pb-4">
                            <CardTitle className="text-base font-black flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-rose-400" />
                                Dalabka Maqaayada (Cart Summary)
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                {selectedItems.length} nooc oo cunto ah ayaa la doortay.
                            </CardDescription>
                        </CardHeader>

                        <form onSubmit={handleSubmitPOSOrder}>
                            <CardContent className="p-5 space-y-4">
                                {/* Selected Items List */}
                                {selectedItems.length === 0 ? (
                                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                                        <p className="text-xs text-slate-500 font-bold">
                                            Wax cunto ah wali ma dooranin
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                        {selectedItems.map((item) => (
                                            <div
                                                key={item.productId}
                                                className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800"
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <p className="font-bold text-slate-200 truncate">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {item.quantity} x {formatCurrency(item.price)}
                                                    </p>
                                                </div>
                                                <span className="font-extrabold text-rose-400">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Customer Info Form */}
                                <div className="space-y-3 pt-2 border-t border-slate-800">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Xogta Macmiilka (Customer Info)
                                    </h4>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-slate-300">Magaca Macmiilka</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                required
                                                placeholder="E.g. Ali Ahmed"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="pl-9 bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-slate-300">Taleefanka EVC / Zaad</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                required
                                                placeholder="61xxxxxxx"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                className="pl-9 bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-slate-300">Cinwaanka Gaarsiinta</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                required
                                                placeholder="Hodan, Taleex, Mogadishu"
                                                value={customerAddress}
                                                onChange={(e) => setCustomerAddress(e.target.value)}
                                                className="pl-9 bg-slate-950 border-slate-800 text-xs text-white rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Total Price */}
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400">JUMLA GUUD (TOTAL):</span>
                                    <span className="text-xl font-black text-rose-400">
                                        {formatCurrency(totalAmount)}
                                    </span>
                                </div>

                                {/* Submit Order Button */}
                                <Button
                                    type="submit"
                                    disabled={submitting || selectedItems.length === 0}
                                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl py-6 text-xs shadow-lg shadow-rose-600/20"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Rasmey Dalabka (Place POS Order)
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
