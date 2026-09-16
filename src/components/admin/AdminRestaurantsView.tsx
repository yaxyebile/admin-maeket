"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Store, Product, Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Utensils,
    DollarSign,
    Package,
    ChevronDown,
    ChevronUp,
    Star,
    ShoppingBag,
    Tag,
    Search,
    Filter,
    X,
    SlidersHorizontal,
    ArrowUpDown,
    RotateCcw,
} from "lucide-react";

export function AdminRestaurantsView() {
    const [restaurants, setRestaurants] = useState<Store[]>([]);
    const [productsByStore, setProductsByStore] = useState<Record<string, Product[]>>({});
    const [revenueByStore, setRevenueByStore] = useState<Record<string, { totalRevenue: number; orderCount: number }>>({});
    const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Search and Filtering State
    const [searchQuery, setSearchQuery] = useState("");
    const [ratingFilter, setRatingFilter] = useState<string>("all");
    const [hasItemsFilter, setHasItemsFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("revenue");
    const [dishSearchQuery, setDishSearchQuery] = useState("");

    // Overall Stats
    const [totalRestaurants, setTotalRestaurants] = useState(0);
    const [totalFoodRevenue, setTotalFoodRevenue] = useState(0);
    const [totalMenuItems, setTotalMenuItems] = useState(0);

    const loadData = useCallback(async () => {
        setLoading(true);

        const [storesRes, productsRes, ordersRes] = await Promise.all([
            supabase.from("stores").select("*"),
            supabase.from("products").select("*"),
            supabase.from("orders").select("*"),
        ]);

        const allStores = (storesRes.data as Store[]) ?? [];
        const allProducts = (productsRes.data as Product[]) ?? [];
        const allOrders = (ordersRes.data as Order[]) ?? [];

        // Filter restaurants: is_restaurant === true OR stores with category/description containing restaurant/food
        const restaurantStores = allStores.filter(
            (s) =>
                s.is_restaurant === true ||
                s.name.toLowerCase().includes("restaurant") ||
                s.name.toLowerCase().includes("food") ||
                s.name.toLowerCase().includes("burger") ||
                s.name.toLowerCase().includes("pizza") ||
                s.description?.toLowerCase().includes("food")
        );

        // If no stores marked yet, include first few for demo display
        const activeRestaurants = restaurantStores.length > 0 ? restaurantStores : allStores.slice(0, 3);

        // Group products by store
        const prodMap: Record<string, Product[]> = {};
        allProducts.forEach((p) => {
            if (!prodMap[p.store_id]) prodMap[p.store_id] = [];
            prodMap[p.store_id].push(p);
        });

        // Group revenue & orders by store
        const revMap: Record<string, { totalRevenue: number; orderCount: number }> = {};
        let combinedRevenue = 0;

        allOrders.forEach((o) => {
            if (!revMap[o.store_id]) {
                revMap[o.store_id] = { totalRevenue: 0, orderCount: 0 };
            }
            revMap[o.store_id].totalRevenue += Number(o.total_amount || 0);
            revMap[o.store_id].orderCount += 1;

            // Add to overall food revenue if order belongs to a restaurant store
            if (activeRestaurants.some((r) => r.id === o.store_id)) {
                combinedRevenue += Number(o.total_amount || 0);
            }
        });

        setRestaurants(activeRestaurants);
        setProductsByStore(prodMap);
        setRevenueByStore(revMap);

        // Total stats
        setTotalRestaurants(activeRestaurants.length);
        setTotalFoodRevenue(combinedRevenue);

        let totalItems = 0;
        activeRestaurants.forEach((r) => {
            totalItems += prodMap[r.id]?.length || 0;
        });
        setTotalMenuItems(totalItems);

        if (activeRestaurants.length > 0) {
            setExpandedStoreId(activeRestaurants[0].id);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const toggleExpand = (storeId: string) => {
        setExpandedStoreId((prev) => (prev === storeId ? null : storeId));
    };

    const clearFilters = () => {
        setSearchQuery("");
        setRatingFilter("all");
        setHasItemsFilter("all");
        setSortBy("revenue");
        setDishSearchQuery("");
    };

    // Filter and sort restaurants
    const filteredRestaurants = restaurants.filter((store) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesNameOrDesc =
            store.name.toLowerCase().includes(query) ||
            (store.description && store.description.toLowerCase().includes(query));

        // Also match if any product inside this store matches dish name
        const storeProducts = productsByStore[store.id] || [];
        const matchesDish = storeProducts.some((p) => p.name.toLowerCase().includes(query));

        const matchesQuery = !query || matchesNameOrDesc || matchesDish;

        // Rating filter
        const rating = store.rating || 4.8;
        let matchesRating = true;
        if (ratingFilter === "4.5") matchesRating = rating >= 4.5;
        else if (ratingFilter === "4.0") matchesRating = rating >= 4.0;

        // Has items filter
        let matchesItems = true;
        if (hasItemsFilter === "yes") matchesItems = storeProducts.length > 0;
        else if (hasItemsFilter === "no") matchesItems = storeProducts.length === 0;

        return matchesQuery && matchesRating && matchesItems;
    }).sort((a, b) => {
        const revA = revenueByStore[a.id]?.totalRevenue || 0;
        const revB = revenueByStore[b.id]?.totalRevenue || 0;
        const countA = (productsByStore[a.id] || []).length;
        const countB = (productsByStore[b.id] || []).length;
        const ratingA = a.rating || 4.8;
        const ratingB = b.rating || 4.8;

        if (sortBy === "revenue") return revB - revA;
        if (sortBy === "orders") return (revenueByStore[b.id]?.orderCount || 0) - (revenueByStore[a.id]?.orderCount || 0);
        if (sortBy === "items") return countB - countA;
        if (sortBy === "rating") return ratingB - ratingA;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
    });

    const isFiltered = searchQuery !== "" || ratingFilter !== "all" || hasItemsFilter !== "all" || sortBy !== "revenue";

    return (
        <div className="space-y-6">
            {/* Top Header Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-xs">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                                Total Restaurants
                            </p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {totalRestaurants}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Maqaayadaha Dhowrka ah</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
                            <Utensils className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-xs">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                Food Revenue ($)
                            </p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {formatCurrency(totalFoodRevenue)}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Dakhliga Raashinka</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-xs">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                                Total Menu Items
                            </p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {totalMenuItems}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Noocyada Cuntada</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                            <Package className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filtering Toolbar */}
            <Card className="border-slate-200 bg-white shadow-sm p-4 rounded-2xl space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Raadi maqaayad, magac cunto, ama faahfaahin..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-9 rounded-xl border-slate-200 text-xs h-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Controls Group */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Rating Filter */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                            <span className="font-bold text-slate-600">Rating:</span>
                            <select
                                value={ratingFilter}
                                onChange={(e) => setRatingFilter(e.target.value)}
                                className="bg-transparent font-extrabold text-slate-800 outline-hidden cursor-pointer"
                            >
                                <option value="all">Dhammaan</option>
                                <option value="4.5">⭐ 4.5+</option>
                                <option value="4.0">⭐ 4.0+</option>
                            </select>
                        </div>

                        {/* Menu Items Filter */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                            <Package className="h-3.5 w-3.5 text-rose-500" />
                            <span className="font-bold text-slate-600">Menu:</span>
                            <select
                                value={hasItemsFilter}
                                onChange={(e) => setHasItemsFilter(e.target.value)}
                                className="bg-transparent font-extrabold text-slate-800 outline-hidden cursor-pointer"
                            >
                                <option value="all">Dhammaan</option>
                                <option value="yes">Leh Cuntooyin</option>
                                <option value="no">Bilaa Cunto</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                            <ArrowUpDown className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="font-bold text-slate-600">Kala saar:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent font-extrabold text-slate-800 outline-hidden cursor-pointer"
                            >
                                <option value="revenue">Dakhliga Ugu Sareeya</option>
                                <option value="orders">Dalabyada Ugu Badan</option>
                                <option value="rating">Rating-ka Ugu Sareeya</option>
                                <option value="items">Cuntooyinka Ugu Badan</option>
                                <option value="name">Magaca (A-Z)</option>
                            </select>
                        </div>

                        {/* Reset Filters */}
                        {isFiltered && (
                            <Button
                                variant="ghost"
                                onClick={clearFilters}
                                className="h-9 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl gap-1.5"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Set-ka celi
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter info status */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>
                        Wuxuu muujinayaa <strong>{filteredRestaurants.length}</strong> maqaayadood oo ka mid ah <strong>{restaurants.length}</strong>
                    </span>
                    {isFiltered && (
                        <Badge className="bg-rose-100 text-rose-700 font-bold text-[10px]">
                            Filters Applied
                        </Badge>
                    )}
                </div>
            </Card>

            {/* Accordion List of Restaurants */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-rose-600" />
                    Liiska Maqaayadaha (Restaurant Accordion)
                </h2>

                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                    </div>
                ) : filteredRestaurants.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                        <Utensils className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700">Maqaayadaha la raadiyay ama la feltereeyay lama helin</p>
                        <p className="text-xs text-slate-400 mt-1">Iska hubi magaca ama dhig Set-ka celi si aad u aragto oo dhan</p>
                        {isFiltered && (
                            <Button
                                onClick={clearFilters}
                                className="mt-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                            >
                                Clear All Filters
                            </Button>
                        )}
                    </Card>
                ) : (
                    filteredRestaurants.map((store) => {
                        const allProducts = productsByStore[store.id] || [];
                        const rev = revenueByStore[store.id] || { totalRevenue: 0, orderCount: 0 };
                        const isExpanded = expandedStoreId === store.id;

                        // Filter dishes inside accordion if dishSearchQuery is set
                        const products = allProducts.filter((p) =>
                            dishSearchQuery === "" || p.name.toLowerCase().includes(dishSearchQuery.toLowerCase())
                        );

                        return (
                            <Card
                                key={store.id}
                                className="border-slate-200 shadow-sm overflow-hidden transition-all rounded-2xl"
                            >
                                {/* Accordion Header */}
                                <div
                                    onClick={() => toggleExpand(store.id)}
                                    className="p-5 bg-white hover:bg-slate-50/80 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={store.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150"}
                                            alt={store.name}
                                            className="h-14 w-14 rounded-2xl object-cover border border-slate-200"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-extrabold text-slate-900 text-base">
                                                    {store.name}
                                                </h3>
                                                <Badge className="bg-rose-100 text-rose-700 text-[10px] font-bold">
                                                    🍔 RESTAURANT
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                                {store.description || "Food & Fast Food Restaurant"}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1 text-amber-500 font-bold">
                                                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                                                    {store.rating || 4.8}
                                                </span>
                                                <span>•</span>
                                                <span>{allProducts.length} Menu Items</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Header Stats & Toggle Icon */}
                                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                        <div className="text-left md:text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Dakhliga Total-ka</p>
                                            <p className="text-lg font-black text-rose-600">
                                                {formatCurrency(rev.totalRevenue)}
                                            </p>
                                        </div>

                                        <div className="text-left md:text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Dalabyada</p>
                                            <p className="text-sm font-extrabold text-slate-800 flex items-center gap-1">
                                                <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                                                {rev.orderCount} Orders
                                            </p>
                                        </div>

                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Accordion Body - Food Menu Items */}
                                {isExpanded && (
                                    <div className="p-5 bg-slate-50/50 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                                <Utensils className="h-4 w-4 text-rose-600" />
                                                Menu & Cuntooyinka ({allProducts.length})
                                            </h4>

                                            {/* Dish Search Inside Store Accordion */}
                                            {allProducts.length > 0 && (
                                                <div className="relative w-full sm:w-60">
                                                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                                    <Input
                                                        placeholder="Raadi cunto maqaayadan..."
                                                        value={dishSearchQuery}
                                                        onChange={(e) => setDishSearchQuery(e.target.value)}
                                                        className="pl-8 h-8 text-xs rounded-xl bg-white border-slate-200"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {products.length === 0 ? (
                                            <p className="text-xs text-slate-400 py-3">
                                                {dishSearchQuery ? "Wax cunto ah oo raadinta shaqeynaya lama helin." : "No menu items added yet."}
                                            </p>
                                        ) : (
                                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {products.map((item) => {
                                                    const origPrice = Number(item.original_price || (item as any).originalPrice || 0);
                                                    const currentPrice = Number(item.price);
                                                    const hasDiscount = origPrice > currentPrice;
                                                    const discountPercent = hasDiscount
                                                        ? Math.round(((origPrice - currentPrice) / origPrice) * 100)
                                                        : 0;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden"
                                                        >
                                                            <img
                                                                src={item.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150"}
                                                                alt={item.name}
                                                                className="h-14 w-14 rounded-lg object-cover border shrink-0"
                                                            />

                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-slate-900 truncate">
                                                                    {item.name}
                                                                </p>

                                                                <div className="flex items-baseline gap-2 mt-1">
                                                                    <span className="text-sm font-extrabold text-rose-600">
                                                                        {formatCurrency(currentPrice)}
                                                                    </span>

                                                                    {hasDiscount && (
                                                                        <span className="text-xs text-slate-400 line-through font-medium">
                                                                            {formatCurrency(origPrice)}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                                        Stock: {item.stock}
                                                                    </span>
                                                                    {item.stock <= 0 && (
                                                                        <Badge className="bg-rose-100 text-rose-700 text-[9px] px-1.5 py-0">
                                                                            Out of stock
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {hasDiscount && (
                                                                <span className="absolute top-2 right-2 rounded-md bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 shadow-xs flex items-center gap-0.5">
                                                                    <Tag className="h-2.5 w-2.5" /> {discountPercent}% OFF
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
