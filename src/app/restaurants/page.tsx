"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Store, Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    Utensils,
    Search,
    Star,
    Sparkles,
    ShoppingBag,
    ArrowRight,
    Tag,
    Clock,
    ChevronRight,
    X,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    SlidersHorizontal,
} from "lucide-react";

export default function RestaurantsListViewPage() {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<Store[]>([]);
    const [productsByStore, setProductsByStore] = useState<Record<string, Product[]>>({});
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Sidebar Restaurant Search & Filtering State
    const [restaurantSearch, setRestaurantSearch] = useState("");
    const [restaurantFilter, setRestaurantFilter] = useState<string>("all");

    // Main Dishes Search, Filter & Sort State
    const [dishSearch, setDishSearch] = useState("");
    const [dishFilter, setDishFilter] = useState<"all" | "discount" | "instock" | "under5">("all");
    const [dishSort, setDishSort] = useState<"recommended" | "price-asc" | "price-desc">("recommended");

    const loadData = useCallback(async () => {
        setLoading(true);

        const [storesRes, productsRes] = await Promise.all([
            supabase.from("stores").select("*"),
            supabase.from("products").select("*"),
        ]);

        const allStores = (storesRes.data as Store[]) ?? [];
        const allProducts = (productsRes.data as Product[]) ?? [];

        // Filter stores where is_restaurant === true or name/description contains food/restaurant
        const restaurantStores = allStores.filter(
            (s) =>
                s.is_restaurant === true ||
                s.name.toLowerCase().includes("restaurant") ||
                s.name.toLowerCase().includes("food") ||
                s.name.toLowerCase().includes("burger") ||
                s.name.toLowerCase().includes("pizza")
        );

        const activeRestaurants = restaurantStores.length > 0 ? restaurantStores : allStores.slice(0, 4);

        const prodMap: Record<string, Product[]> = {};
        allProducts.forEach((p) => {
            if (!prodMap[p.store_id]) prodMap[p.store_id] = [];
            prodMap[p.store_id].push(p);
        });

        setRestaurants(activeRestaurants);
        setProductsByStore(prodMap);

        if (activeRestaurants.length > 0) {
            setSelectedStoreId(activeRestaurants[0].id);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Sidebar Filtered Restaurants
    const filteredRestaurants = restaurants.filter((r) => {
        const query = restaurantSearch.toLowerCase().trim();
        const matchesName = r.name.toLowerCase().includes(query) || (r.description && r.description.toLowerCase().includes(query));

        let matchesFilter = true;
        if (restaurantFilter === "rating") {
            matchesFilter = (r.rating || 4.9) >= 4.5;
        } else if (restaurantFilter === "discounts") {
            const storeProducts = productsByStore[r.id] || [];
            matchesFilter = storeProducts.some((p) => Number(p.original_price || (p as any).originalPrice || 0) > Number(p.price));
        }

        return matchesName && matchesFilter;
    });

    const activeStore = restaurants.find((r) => r.id === selectedStoreId) || filteredRestaurants[0] || restaurants[0];
    const activeProducts = activeStore ? (productsByStore[activeStore.id] || []) : [];

    // Filter & Sort Dishes
    const filteredProducts = activeProducts
        .filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(dishSearch.toLowerCase().trim());
            const origPrice = Number(p.original_price || (p as any).originalPrice || 0);
            const currentPrice = Number(p.price);
            const hasDiscount = origPrice > currentPrice;

            let matchesFilter = true;
            if (dishFilter === "discount") matchesFilter = hasDiscount;
            else if (dishFilter === "instock") matchesFilter = p.stock > 0;
            else if (dishFilter === "under5") matchesFilter = currentPrice <= 5;

            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            const priceA = Number(a.price);
            const priceB = Number(b.price);

            if (dishSort === "price-asc") return priceA - priceB;
            if (dishSort === "price-desc") return priceB - priceA;
            return 0; // recommended / default order
        });

    const handleAddToCart = (product: Product) => {
        if (product.stock <= 0) {
            toast.error("Cuntadan stock-gii waa ka dhamaaday!");
            return;
        }
        toast.success(`✅ ${product.name} waa lagu daray cart-ka!`);
        router.push("/checkout");
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 space-y-6">
            {/* Top Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-700 via-rose-600 to-rose-800 p-6 sm:p-10 text-white shadow-xl">
                <div className="relative z-10 max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
                        <Utensils className="h-4 w-4 text-rose-200" />
                        <span>MOGADISHU FOOD DELIVERY</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                        🍔 Maqaayadaha & Food Delivery
                    </h1>
                    <p className="text-sm text-rose-100 leading-relaxed">
                        Ka dalbo cuntooyinka ugu dhadhanka badan maqaayadaha Muqdisho iyadoo toos EVC Plus loogu bixinayo oo gaarsiinta la raacinayo.
                    </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
            </div>

            {/* Main Container */}
            <div className="grid gap-6 lg:grid-cols-4">
                {/* Left Column: Restaurants Sidebar Selection with Search & Filter */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Utensils className="h-4 w-4 text-rose-600" />
                                Maqaayadaha ({filteredRestaurants.length})
                            </h2>
                        </div>

                        {/* Search Bar for Restaurants */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Raadi maqaayad..."
                                value={restaurantSearch}
                                onChange={(e) => setRestaurantSearch(e.target.value)}
                                className="pl-8 pr-7 h-9 text-xs rounded-xl bg-white border-slate-200"
                            />
                            {restaurantSearch && (
                                <button
                                    onClick={() => setRestaurantSearch("")}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Quick Filter Buttons for Restaurants */}
                        <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-1">
                            <button
                                onClick={() => setRestaurantFilter("all")}
                                className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${restaurantFilter === "all"
                                    ? "bg-rose-600 text-white border-rose-600"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setRestaurantFilter("rating")}
                                className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${restaurantFilter === "rating"
                                    ? "bg-rose-600 text-white border-rose-600"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                ⭐ 4.5+
                            </button>
                            <button
                                onClick={() => setRestaurantFilter("discounts")}
                                className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${restaurantFilter === "discounts"
                                    ? "bg-rose-600 text-white border-rose-600"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                🔥 Discounts
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-16 w-full rounded-2xl" />
                            <Skeleton className="h-16 w-full rounded-2xl" />
                        </div>
                    ) : filteredRestaurants.length === 0 ? (
                        <Card className="p-4 text-center border-dashed">
                            <p className="text-xs font-bold text-slate-500">Maqaayad lama helin</p>
                        </Card>
                    ) : (
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                            {filteredRestaurants.map((r) => {
                                const isSelected = r.id === activeStore?.id;
                                const itemCount = (productsByStore[r.id] || []).length;

                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => setSelectedStoreId(r.id)}
                                        className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${isSelected
                                            ? "border-rose-600 bg-rose-50/80 shadow-xs"
                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={r.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150"}
                                                alt={r.name}
                                                className="h-12 w-12 rounded-xl object-cover border shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-extrabold text-xs text-slate-900 truncate">
                                                    {r.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                                        <Star className="h-3 w-3 fill-amber-400" /> {r.rating || 4.9}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{itemCount} items</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className={`h-4 w-4 ${isSelected ? "text-rose-600" : "text-slate-300"}`} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column: Restaurant Food Menu & Search / Filters */}
                <div className="lg:col-span-3 space-y-4">
                    {activeStore && (
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={activeStore.logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150"}
                                        alt={activeStore.name}
                                        className="h-14 w-14 rounded-2xl object-cover border"
                                    />
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">{activeStore.name}</h2>
                                        <p className="text-xs text-slate-500">{activeStore.description || "Fast Food & Delicious Cuisine"}</p>
                                    </div>
                                </div>

                                {/* Dish Search Bar */}
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Raadi cunto..."
                                        value={dishSearch}
                                        onChange={(e) => setDishSearch(e.target.value)}
                                        className="pl-9 pr-8 rounded-xl text-xs"
                                    />
                                    {dishSearch && (
                                        <button
                                            onClick={() => setDishSearch("")}
                                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Food Filter Pills & Sort Dropdown */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => setDishFilter("all")}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${dishFilter === "all"
                                            ? "bg-rose-600 text-white shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        Dhammaan ({activeProducts.length})
                                    </button>
                                    <button
                                        onClick={() => setDishFilter("discount")}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${dishFilter === "discount"
                                            ? "bg-rose-600 text-white shadow-xs"
                                            : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                            }`}
                                    >
                                        <Tag className="h-3 w-3" /> 🔥 Qiimo Dhimis Only
                                    </button>
                                    <button
                                        onClick={() => setDishFilter("instock")}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${dishFilter === "instock"
                                            ? "bg-rose-600 text-white shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        ✅ In Stock
                                    </button>
                                    <button
                                        onClick={() => setDishFilter("under5")}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${dishFilter === "under5"
                                            ? "bg-rose-600 text-white shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        💵 Under $5
                                    </button>
                                </div>

                                {/* Sort Selector */}
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="font-bold text-slate-500">Sort:</span>
                                    <select
                                        value={dishSort}
                                        onChange={(e) => setDishSort(e.target.value as any)}
                                        className="bg-transparent font-extrabold text-slate-800 outline-hidden cursor-pointer"
                                    >
                                        <option value="recommended">Recommended</option>
                                        <option value="price-asc">Price: Low to High</option>
                                        <option value="price-desc">Price: High to Low</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Grid */}
                    {loading ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Skeleton className="h-64 w-full rounded-2xl" />
                            <Skeleton className="h-64 w-full rounded-2xl" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <Card className="p-12 text-center border-dashed">
                            <Utensils className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                            <p className="font-bold text-slate-700">Cuntooyinka maqaayada lama helin</p>
                            <p className="text-xs text-slate-400 mt-1">Dhig ama baddi filter-ka si aad u aragto cuntooyinka kale</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredProducts.map((product) => {
                                const origPrice = Number(product.original_price || (product as any).originalPrice || 0);
                                const currentPrice = Number(product.price);
                                const hasDiscount = origPrice > currentPrice;
                                const discountPercent = hasDiscount
                                    ? Math.round(((origPrice - currentPrice) / origPrice) * 100)
                                    : 0;
                                const isOutOfStock = product.stock <= 0;

                                return (
                                    <Card
                                        key={product.id}
                                        className="overflow-hidden border-slate-200 shadow-sm rounded-2xl flex flex-col justify-between hover:shadow-md transition-all group"
                                    >
                                        <div>
                                            {/* Product Image & Badges */}
                                            <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                                                <img
                                                    src={product.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />

                                                {/* Discount Badge */}
                                                {hasDiscount && !isOutOfStock && (
                                                    <span className="absolute top-3 right-3 rounded-xl bg-rose-600 text-white font-black text-xs px-2.5 py-1 shadow-md flex items-center gap-1">
                                                        <Tag className="h-3 w-3" /> {discountPercent}% OFF
                                                    </span>
                                                )}

                                                {/* Out of stock Overlay Badge */}
                                                {isOutOfStock && (
                                                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                                                        <span className="bg-rose-600 font-black text-xs px-3 py-1 rounded-full uppercase shadow-lg">
                                                            Out of Stock
                                                        </span>
                                                        <span className="text-[11px] text-slate-300 mt-1">
                                                            Waa ka dhamaaday maqaayada
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <CardContent className="p-4 space-y-1.5">
                                                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-rose-600 transition-colors">
                                                    {product.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 line-clamp-2">
                                                    {product.description || "Freshly cooked Somali cuisine meal."}
                                                </p>

                                                {/* Pricing with Original Price Strike-through */}
                                                <div className="flex items-baseline gap-2 pt-2">
                                                    <span className="text-xl font-black text-rose-600">
                                                        {formatCurrency(currentPrice)}
                                                    </span>
                                                    {hasDiscount && (
                                                        <span className="text-xs text-slate-400 line-through font-medium">
                                                            {formatCurrency(origPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </div>

                                        {/* Bottom Action Button with Out of Stock Guard */}
                                        <div className="p-4 pt-0">
                                            <Button
                                                onClick={() => handleAddToCart(product)}
                                                disabled={isOutOfStock}
                                                className={`w-full font-bold rounded-xl text-xs py-5 transition-all ${isOutOfStock
                                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                    : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
                                                    }`}
                                            >
                                                {isOutOfStock ? (
                                                    "Out of Stock"
                                                ) : (
                                                    <>
                                                        <ShoppingBag className="h-4 w-4 mr-1.5" />
                                                        Dalbo Hadda (Add to Order)
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
