"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import type { Store, Product } from "@/lib/types";
import { formatCurrency, generateId } from "@/lib/utils";
import { DualImageInput } from "@/components/dual-image-input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    Utensils,
    Plus,
    Sparkles,
    Edit2,
    Trash2,
    Search,
    Tag,
    X,
    Filter,
    ArrowUpDown,
    RotateCcw,
} from "lucide-react";

export default function RestaurantMenuPage() {
    const { user } = useAuth();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Search, Filter & Sort State
    const [searchQuery, setSearchQuery] = useState("");
    const [menuFilter, setMenuFilter] = useState<"all" | "discount" | "instock" | "outstock">("all");
    const [menuSort, setMenuSort] = useState<"name" | "price-asc" | "price-desc" | "stock">("name");

    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Product | null>(null);
    const [submittingItem, setSubmittingItem] = useState(false);
    const [itemForm, setItemForm] = useState({
        name: "",
        price: "",
        originalPrice: "",
        stock: "100",
        image: "",
        description: "",
    });

    const loadData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);

        try {
            let myStore: Store | null = null;

            // 1. Primary check: Store assigned to profile store_id
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

            // 2. Secondary check: Store owned by user.id
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

            // 3. Fallback only if no store linked to this specific user account
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
                setProducts((storeProds as Product[]) || []);
            }
        } catch (err) {
            console.error("Menu load error:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.store_id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
            toast.error("Restaurant store strictly required");
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

            setSubmittingItem(false);
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

            setSubmittingItem(false);
            if (error) toast.error(error.message);
            else {
                toast.success("✅ Cunto cusub waa lagu daray Menu-ga");
                setItemModalOpen(false);
                loadData();
            }
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Ma cinwaansan tahay inaad tirtirto cuntadan?")) return;
        const { error } = await supabase.from("products").delete().eq("id", itemId);
        if (error) toast.error(error.message);
        else {
            toast.success("Cuntada waa la tirtiray");
            loadData();
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setMenuFilter("all");
        setMenuSort("name");
    };

    const filteredProducts = products
        .filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
            const origPrice = Number(p.original_price || (p as any).originalPrice || 0);
            const currentPrice = Number(p.price);
            const hasDiscount = origPrice > currentPrice;

            let matchesFilter = true;
            if (menuFilter === "discount") matchesFilter = hasDiscount;
            else if (menuFilter === "instock") matchesFilter = p.stock > 0;
            else if (menuFilter === "outstock") matchesFilter = p.stock <= 0;

            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            const priceA = Number(a.price);
            const priceB = Number(b.price);
            if (menuSort === "price-asc") return priceA - priceB;
            if (menuSort === "price-desc") return priceB - priceA;
            if (menuSort === "stock") return b.stock - a.stock;
            return a.name.localeCompare(b.name);
        });

    const isFiltered = searchQuery !== "" || menuFilter !== "all" || menuSort !== "name";

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 p-6 rounded-3xl text-white shadow-xl">
                <div>
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black uppercase">
                        MENU & DISCOUNT MANAGER
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black mt-2">
                        Maamul Cuntooyinka & Discounts-ka
                    </h1>
                    <p className="text-xs text-slate-300 mt-1">
                        Ku dar, baddi, ama maamul qiimo dhimista menu-ga maqaayada.
                    </p>
                </div>

                <Button
                    onClick={() => handleOpenItemModal()}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl px-6 py-6 text-xs gap-2"
                >
                    <Plus className="h-4 w-4" /> Ku dar Cunto Cusub
                </Button>
            </div>

            {/* Search, Filter & Sort Toolbar */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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

                    {/* Filter Pills */}
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

                        {/* Sort selector */}
                        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                            <select
                                value={menuSort}
                                onChange={(e) => setMenuSort(e.target.value as any)}
                                className="bg-transparent font-extrabold text-white outline-hidden cursor-pointer"
                            >
                                <option value="name">Magaca (A-Z)</option>
                                <option value="price-asc">Qiimaha: Low to High</option>
                                <option value="price-desc">Qiimaha: High to Low</option>
                                <option value="stock">Stock Level</option>
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
                    <Skeleton className="h-48 w-full rounded-2xl bg-slate-800" />
                    <Skeleton className="h-48 w-full rounded-2xl bg-slate-800" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <Card className="p-12 text-center border-slate-800 bg-slate-900/40 rounded-3xl">
                    <Utensils className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                    <p className="font-bold text-slate-300">
                        {isFiltered ? "Cunto la feltereeyay ama la raadiyay lama helin" : "Wali cunto ma ku jirtay Menu-ga"}
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
                                className="overflow-hidden border-slate-800 bg-slate-900 shadow-md rounded-2xl flex flex-col justify-between"
                            >
                                <div>
                                    <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                                        <img
                                            src={item.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                        />
                                        {hasDiscount && (
                                            <span className="absolute top-3 right-3 rounded-xl bg-rose-600 text-white font-black text-xs px-2.5 py-1 shadow-lg flex items-center gap-1">
                                                <Tag className="h-3 w-3" /> {discountPercent}% OFF
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
                                            {item.description || "Somali delicacy food item."}
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
                                    </CardContent>
                                </div>

                                <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleOpenItemModal(item)}
                                        className="h-9 rounded-xl text-xs border-slate-700 bg-slate-800 text-slate-200"
                                    >
                                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Wax ka baddi
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="h-9 rounded-xl text-xs bg-rose-600 text-white"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Dialog Modal */}
            <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
                <DialogContent className="max-w-md rounded-3xl p-6 bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-white">
                            {editingItem ? "Wax ka baddi Cuntada Menu-ga" : "Ku dar Cunto Cusub Menu-ga"}
                        </DialogTitle>
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
