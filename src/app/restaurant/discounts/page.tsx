"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import type { Store, Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    Utensils,
    Tag,
    Percent,
    Sparkles,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    X,
    RotateCcw,
    ArrowUpDown,
    Zap,
} from "lucide-react";

export default function RestaurantDiscountsPage() {
    const { user } = useAuth();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    // Search, Filter & Sort State
    const [searchQuery, setSearchQuery] = useState("");
    const [discountFilter, setDiscountFilter] = useState<"all" | "active" | "mega" | "none">("all");
    const [discountSort, setDiscountSort] = useState<"discount-desc" | "price-asc" | "price-desc" | "name">("discount-desc");

    // Local inputs state for setting custom discounts
    const [discountInputs, setDiscountInputs] = useState<Record<string, { orig: string; disc: string }>>({});

    const loadData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);

        try {
            let myStore: Store | null = null;

            if (user.store_id) {
                const { data: storeByProfile } = await supabase
                    .from("stores")
                    .select("*")
                    .eq("id", user.store_id)
                    .maybeSingle();
                if (storeByProfile) {
                    myStore = storeByProfile as Store;
                }
            }

            if (!myStore) {
                const { data: storeByOwner } = await supabase
                    .from("stores")
                    .select("*")
                    .eq("owner_id", user.id)
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
                const { data: storeProds } = await supabase
                    .from("products")
                    .select("*")
                    .eq("store_id", myStore.id);

                const prods = (storeProds as Product[]) || [];
                setProducts(prods);

                const inputsMap: Record<string, { orig: string; disc: string }> = {};
                prods.forEach((p) => {
                    inputsMap[p.id] = {
                        orig: (p.original_price || p.price).toString(),
                        disc: p.price.toString(),
                    };
                });
                setDiscountInputs(inputsMap);
            }
        } catch (err) {
            console.error("Discounts load error:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.store_id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleApplyDiscount = async (product: Product) => {
        const itemInput = discountInputs[product.id];
        if (!itemInput) return;

        const origPriceNum = parseFloat(itemInput.orig);
        const discPriceNum = parseFloat(itemInput.disc);

        if (isNaN(origPriceNum) || isNaN(discPriceNum) || discPriceNum <= 0) {
            toast.error("Fadlan geli qiimaha saxda ah");
            return;
        }

        if (discPriceNum >= origPriceNum) {
            toast.error("Qiimaha Discount-ka waa inuu ka yaraadaa Original Price-ka");
            return;
        }

        setSavingId(product.id);

        const { error } = await supabase
            .from("products")
            .update({
                original_price: origPriceNum,
                price: discPriceNum,
            })
            .eq("id", product.id);

        setSavingId(null);
        if (error) toast.error(error.message);
        else {
            toast.success(`✅ Discount-ka ${product.name} waa la meelmariyay!`);
            loadData();
        }
    };

    const handleRemoveDiscount = async (product: Product) => {
        const itemInput = discountInputs[product.id];
        const origPriceNum = parseFloat(itemInput?.orig || product.original_price?.toString() || product.price.toString());

        setSavingId(product.id);

        const { error } = await supabase
            .from("products")
            .update({
                original_price: null,
                price: origPriceNum,
            })
            .eq("id", product.id);

        setSavingId(null);
        if (error) toast.error(error.message);
        else {
            toast.success(`Discount-kii waa ka baxay ${product.name}`);
            loadData();
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setDiscountFilter("all");
        setDiscountSort("discount-desc");
    };

    const filteredProducts = products
        .filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
            const origPrice = Number(p.original_price || (p as any).originalPrice || 0);
            const currentPrice = Number(p.price);
            const hasDiscount = origPrice > currentPrice;
            const discountPercent = hasDiscount
                ? Math.round(((origPrice - currentPrice) / origPrice) * 100)
                : 0;

            let matchesFilter = true;
            if (discountFilter === "active") matchesFilter = hasDiscount;
            else if (discountFilter === "mega") matchesFilter = discountPercent >= 30;
            else if (discountFilter === "none") matchesFilter = !hasDiscount;

            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            const origA = Number(a.original_price || a.price);
            const currA = Number(a.price);
            const discA = origA > currA ? Math.round(((origA - currA) / origA) * 100) : 0;

            const origB = Number(b.original_price || b.price);
            const currB = Number(b.price);
            const discB = origB > currB ? Math.round(((origB - currB) / origB) * 100) : 0;

            if (discountSort === "discount-desc") return discB - discA;
            if (discountSort === "price-asc") return currA - currB;
            if (discountSort === "price-desc") return currB - currA;
            return a.name.localeCompare(b.name);
        });

    const isFiltered = searchQuery !== "" || discountFilter !== "all" || discountSort !== "discount-desc";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 p-6 rounded-3xl text-white shadow-xl">
                <div>
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black uppercase">
                        SPECIAL OFFERS & DISCOUNTS
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black mt-2">
                        Maamul Qiimo Dhimista (Restaurant Discounts)
                    </h1>
                    <p className="text-xs text-slate-300 mt-1">
                        Sii cuntooyinka maqaayada qiimo dhimis toos ah oo ku muuqanaya App-ka guud.
                    </p>
                </div>
            </div>

            {/* Search, Filter & Sort Controls Toolbar */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Raadi cunto ama raashin..."
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

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setDiscountFilter("all")}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${discountFilter === "all"
                                ? "bg-rose-600 text-white"
                                : "bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800"
                                }`}
                        >
                            All ({products.length})
                        </button>
                        <button
                            onClick={() => setDiscountFilter("active")}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${discountFilter === "active"
                                ? "bg-rose-600 text-white"
                                : "bg-slate-950 text-rose-400 hover:bg-slate-800 border border-slate-800"
                                }`}
                        >
                            <Tag className="h-3 w-3" /> 🔥 Active Discounts
                        </button>
                        <button
                            onClick={() => setDiscountFilter("mega")}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${discountFilter === "mega"
                                ? "bg-rose-600 text-white"
                                : "bg-slate-950 text-amber-400 hover:bg-slate-800 border border-slate-800"
                                }`}
                        >
                            <Zap className="h-3 w-3" /> ⚡ Mega (30%+ OFF)
                        </button>
                        <button
                            onClick={() => setDiscountFilter("none")}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${discountFilter === "none"
                                ? "bg-rose-600 text-white"
                                : "bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800"
                                }`}
                        >
                            ❌ No Discount
                        </button>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                            <select
                                value={discountSort}
                                onChange={(e) => setDiscountSort(e.target.value as any)}
                                className="bg-transparent font-extrabold text-white outline-hidden cursor-pointer"
                            >
                                <option value="discount-desc">Discount % High-to-Low</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="name">Magaca (A-Z)</option>
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
                        Muujinayaa <strong>{filteredProducts.length}</strong> items oo ka mid ah <strong>{products.length}</strong>
                    </span>
                    {isFiltered && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded-md">
                            Filter Active
                        </span>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-56 w-full rounded-2xl bg-slate-800" />
                    <Skeleton className="h-56 w-full rounded-2xl bg-slate-800" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <Card className="p-12 text-center border-slate-800 bg-slate-900/40 rounded-3xl">
                    <Tag className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                    <p className="font-bold text-slate-300">
                        {isFiltered ? "Cunto la feltereeyay ama la raadiyay lama helin" : "Wali cuntooyinka maqaayada lama soo gelin"}
                    </p>
                    {isFiltered && (
                        <Button
                            onClick={clearFilters}
                            className="mt-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                        >
                            Clear Filters
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((p) => {
                        const origPrice = Number(p.original_price || (p as any).originalPrice || p.price);
                        const currentPrice = Number(p.price);
                        const hasDiscount = origPrice > currentPrice;
                        const discountPercent = hasDiscount
                            ? Math.round(((origPrice - currentPrice) / origPrice) * 100)
                            : 0;

                        const currentInputs = discountInputs[p.id] || {
                            orig: origPrice.toString(),
                            disc: currentPrice.toString(),
                        };

                        return (
                            <Card
                                key={p.id}
                                className="overflow-hidden border-slate-800 bg-slate-900 shadow-md rounded-2xl flex flex-col justify-between"
                            >
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={p.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200"}
                                            alt={p.name}
                                            className="h-14 w-14 rounded-xl object-cover border border-slate-700 shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <h3 className="font-extrabold text-white text-sm truncate">{p.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {hasDiscount ? (
                                                    <Badge className="bg-rose-600 text-white font-black text-[10px]">
                                                        🔥 {discountPercent}% OFF ACTIVE
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-slate-800 text-slate-400 font-bold text-[10px]">
                                                        NO DISCOUNT
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Discount form inputs */}
                                    <div className="grid gap-2 grid-cols-2 pt-2 border-t border-slate-800">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Original ($)</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={currentInputs.orig}
                                                onChange={(e) =>
                                                    setDiscountInputs({
                                                        ...discountInputs,
                                                        [p.id]: { ...currentInputs, orig: e.target.value },
                                                    })
                                                }
                                                className="bg-slate-950 border-slate-800 text-white rounded-xl text-xs h-9 font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-rose-400 uppercase">New Offer ($)</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={currentInputs.disc}
                                                onChange={(e) =>
                                                    setDiscountInputs({
                                                        ...discountInputs,
                                                        [p.id]: { ...currentInputs, disc: e.target.value },
                                                    })
                                                }
                                                className="bg-slate-950 border-slate-800 text-rose-400 rounded-xl text-xs h-9 font-black"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
                                    {hasDiscount && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemoveDiscount(p)}
                                            disabled={savingId === p.id}
                                            className="h-9 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl"
                                        >
                                            Kaa bixi Discount-ka
                                        </Button>
                                    )}

                                    <Button
                                        size="sm"
                                        onClick={() => handleApplyDiscount(p)}
                                        disabled={savingId === p.id}
                                        className="h-9 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl ml-auto"
                                    >
                                        {savingId === p.id ? "Saving..." : "Apply Discount"}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
