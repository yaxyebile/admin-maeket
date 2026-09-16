"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import type { Store, Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { isDiscountActive, getDiscountCountdown, getExpiryDateFromDuration } from "@/lib/discount-utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
    Sparkles,
    Tag,
    Percent,
    Zap,
    Edit2,
    RefreshCw,
    Search,
    Clock,
    Package,
} from "lucide-react";

export default function SellerDiscountsPage() {
    const { user } = useAuth();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Bulk Discount state
    const [bulkPercent, setBulkPercent] = useState<string>("15");
    const [bulkDuration, setBulkDuration] = useState<string>("1day");
    const [applyingBulk, setApplyingBulk] = useState(false);

    // Individual Edit Modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [customDiscountPercent, setCustomDiscountPercent] = useState<string>("");
    const [origPriceInput, setOrigPriceInput] = useState<string>("");
    const [salePriceInput, setSalePriceInput] = useState<string>("");
    const [individualDuration, setIndividualDuration] = useState<string>("1day");
    const [savingIndividual, setSavingIndividual] = useState(false);

    const loadData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);

        try {
            // High Performance Targeted Query: Fetch ONLY user's store
            let { data: stores } = await supabase
                .from("stores")
                .select("*")
                .eq("owner_id", user.id)
                .limit(1);

            let myStore = stores?.[0];
            if (!myStore) {
                const { data: fallbackStores } = await supabase.from("stores").select("*").limit(1);
                myStore = fallbackStores?.[0];
            }

            setStore(myStore || null);

            if (myStore) {
                // High Performance Targeted Query: Fetch ONLY products for this store
                const { data: storeProds } = await supabase
                    .from("products")
                    .select("*")
                    .eq("store_id", myStore.id);

                setProducts((storeProds as Product[]) || []);
            }
        } catch (err) {
            console.error("Fast load error:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Bulk Discount Handler with Expiration
    const handleApplyBulkDiscount = async () => {
        const percent = parseFloat(bulkPercent);
        if (isNaN(percent) || percent <= 0 || percent >= 100) {
            toast.error("Fadlan geli boqolley sax ah (e.g. 10%, 20%, 30%)");
            return;
        }
        if (products.length === 0) {
            toast.error("Wax alaab ah oo dukaanka ku jirta ma jiro");
            return;
        }

        const expiryIso = getExpiryDateFromDuration(bulkDuration);
        setApplyingBulk(true);

        try {
            const updates = products.map((p) => {
                const basePrice = Number(p.original_price || p.price);
                const discountedPrice = Math.max(0.1, Number((basePrice * (1 - percent / 100)).toFixed(2)));

                return supabase
                    .from("products")
                    .update({
                        original_price: basePrice,
                        price: discountedPrice,
                        discount_expires_at: expiryIso,
                    })
                    .eq("id", p.id);
            });

            await Promise.all(updates);
            toast.success(`✅ ${percent}% Discount waxaa loo meelmariyay dhammaan alaabta dukaanka!`);
            loadData();
        } catch {
            toast.error("Cillad ayaa dhacday marka la meelmarinayay discount-ka");
        } finally {
            setApplyingBulk(false);
        }
    };

    // Clear All Discounts Handler
    const handleClearAllDiscounts = async () => {
        if (!confirm("Ma cinwaansan tahay inaad tirtirto dhammaan discount-yada dukaanka?")) return;
        setApplyingBulk(true);

        try {
            const updates = products.map((p) => {
                const resetPrice = Number(p.original_price || p.price);
                return supabase
                    .from("products")
                    .update({
                        price: resetPrice,
                        original_price: null,
                        discount_expires_at: null,
                    })
                    .eq("id", p.id);
            });

            await Promise.all(updates);
            toast.success("✅ Dhammaan discount-yadii waa la tirtiray.");
            loadData();
        } catch {
            toast.error("Cillad ayaa dhacday");
        } finally {
            setApplyingBulk(false);
        }
    };

    // Open Edit Modal for a specific product
    const handleOpenEditModal = (p: Product) => {
        setSelectedProduct(p);
        const orig = Number(p.original_price || p.price);
        const sale = Number(p.price);

        setOrigPriceInput(orig.toString());
        setSalePriceInput(sale.toString());
        setIndividualDuration(p.discount_expires_at ? "custom" : "1day");

        if (orig > sale) {
            const pct = Math.round(((orig - sale) / orig) * 100);
            setCustomDiscountPercent(pct.toString());
        } else {
            setCustomDiscountPercent("");
        }
        setEditModalOpen(true);
    };

    const handlePercentInputChange = (val: string) => {
        setCustomDiscountPercent(val);
        const pct = parseFloat(val);
        const orig = parseFloat(origPriceInput);

        if (!isNaN(pct) && !isNaN(orig) && orig > 0) {
            const calcSale = Math.max(0.1, Number((orig * (1 - pct / 100)).toFixed(2)));
            setSalePriceInput(calcSale.toString());
        }
    };

    // Save Individual Product Discount
    const handleSaveIndividualDiscount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        const orig = parseFloat(origPriceInput);
        const sale = parseFloat(salePriceInput);

        if (isNaN(orig) || orig <= 0 || isNaN(sale) || sale <= 0) {
            toast.error("Fadlan geli qiime sax ah");
            return;
        }

        setSavingIndividual(true);
        const expiryIso = getExpiryDateFromDuration(individualDuration);

        try {
            const { error } = await supabase
                .from("products")
                .update({
                    original_price: orig > sale ? orig : null,
                    price: sale,
                    discount_expires_at: orig > sale ? expiryIso : null,
                })
                .eq("id", selectedProduct.id);

            if (error) {
                toast.error(error.message);
            } else {
                toast.success(`✅ Discount-ka ${selectedProduct.name} waa la kaydiyay`);
                setEditModalOpen(false);
                loadData();
            }
        } catch {
            toast.error("Cillad ayaa dhacday marka la kaydinayay");
        } finally {
            setSavingIndividual(false);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeDiscountedCount = products.filter((p) => isDiscountActive(p)).length;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Discounts & Expiration Manager"
                description="Ku sameey discount waqti/taariiq gaar ah ku dhacaya alaabta dukaankaaga"
            />

            {/* Bulk Discount Engine with Expiration */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-indigo-950 to-purple-900 p-6 md:p-8 text-white shadow-xl">
                <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white backdrop-blur-md">
                        <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                        <span>FAST BULK DISCOUNT ENGINE</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black">
                        Ku sameey Discount leh Taariiq Expiry ah!
                    </h2>

                    <p className="text-xs md:text-sm text-indigo-100 max-w-2xl">
                        U yeel discount-ka muddo kooban (e.g. 1 Maalin, 3 Maalmood, 7 Maalmood) si macaamiishu ay ugu degdegaan iibsiga alaabta dukaankaaga.
                    </p>

                    {/* Controls */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-md">
                            <span className="pl-3 text-xs font-bold text-slate-200">Boqolleyda:</span>
                            <Input
                                type="number"
                                placeholder="15"
                                value={bulkPercent}
                                onChange={(e) => setBulkPercent(e.target.value)}
                                className="w-16 bg-white text-slate-900 font-extrabold text-center rounded-xl h-9 text-sm"
                            />
                            <span className="pr-2 font-black text-sm">%</span>
                        </div>

                        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-md">
                            <Clock className="h-4 w-4 text-amber-300 ml-2" />
                            <span className="text-xs font-bold text-slate-200">Muddada:</span>
                            <Select value={bulkDuration} onValueChange={setBulkDuration}>
                                <SelectTrigger className="w-36 bg-white text-slate-900 font-bold h-9 text-xs rounded-xl border-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1day">⏳ 1 Maalin (24 Hours)</SelectItem>
                                    <SelectItem value="3days">⚡ 3 Maalmood</SelectItem>
                                    <SelectItem value="7days">📅 7 Maalmood (1 Todobaad)</SelectItem>
                                    <SelectItem value="30days">🗓️ 30 Maalmood (1 Bil)</SelectItem>
                                    <SelectItem value="never">♾️ No Expiration</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleApplyBulkDiscount}
                            disabled={applyingBulk}
                            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs px-6 py-5 shadow-lg gap-2"
                        >
                            <Zap className="h-4 w-4 fill-slate-950" />
                            {applyingBulk ? "Meelmarinayaa..." : `Ku meelmeri ${bulkPercent}% OFF (${bulkDuration})`}
                        </Button>

                        <Button
                            onClick={handleClearAllDiscounts}
                            disabled={applyingBulk}
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/20 font-bold rounded-xl text-xs py-5"
                        >
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                            Clear Discounts
                        </Button>
                    </div>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Dhammaan Alaabta</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{products.length} Products</h3>
                        </div>
                        <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Package className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-indigo-200 bg-indigo-50/40 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-indigo-600 uppercase">Active Discount (No Expiry / Valid)</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeDiscountedCount} Products</h3>
                        </div>
                        <div className="h-11 w-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Tag className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-emerald-200 bg-emerald-50/40 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-emerald-600 uppercase">Active Discount Rate</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {products.length > 0 ? Math.round((activeDiscountedCount / products.length) * 100) : 0}% Active
                            </h3>
                        </div>
                        <div className="h-11 w-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                            <Percent className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Individual Products List */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                        Alaab Kasta iyo Taariiqda uu ku Dhacayo Discount-keedu
                    </h3>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Raadi alaab..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 text-xs rounded-xl"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-44 w-full rounded-2xl" />
                        <Skeleton className="h-44 w-full rounded-2xl" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <Package className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700">Wax alaab ah ma laga helin dukaanka</p>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredProducts.map((p) => {
                            const origPrice = Number(p.original_price || p.price);
                            const currentPrice = Number(p.price);
                            const discountActive = isDiscountActive(p);
                            const countdownStr = getDiscountCountdown(p.discount_expires_at);
                            const isExpired = countdownStr === "Expired";
                            const hasDiscount = origPrice > currentPrice;
                            const discountPercent = hasDiscount
                                ? Math.round(((origPrice - currentPrice) / origPrice) * 100)
                                : 0;

                            return (
                                <Card
                                    key={p.id}
                                    className={`border transition-all rounded-2xl overflow-hidden ${discountActive
                                            ? "border-indigo-300 bg-indigo-50/20 shadow-sm"
                                            : isExpired
                                                ? "border-amber-300 bg-amber-50/20"
                                                : "border-slate-200"
                                        }`}
                                >
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <img
                                                src={p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150"}
                                                alt={p.name}
                                                className="h-16 w-16 rounded-xl object-cover border border-slate-200 shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <h4 className="font-extrabold text-slate-900 text-sm truncate">{p.name}</h4>
                                                    {discountActive && (
                                                        <Badge className="bg-indigo-600 text-white font-extrabold text-[10px] px-2 py-0.5 shrink-0">
                                                            {discountPercent}% OFF
                                                        </Badge>
                                                    )}
                                                    {isExpired && (
                                                        <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[9px] font-bold">
                                                            EXPIRED
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-baseline gap-2 mt-1">
                                                    <span
                                                        className={`text-base font-black ${discountActive ? "text-indigo-600" : "text-slate-900"
                                                            }`}
                                                    >
                                                        {formatCurrency(discountActive ? currentPrice : origPrice)}
                                                    </span>
                                                    {discountActive && (
                                                        <span className="text-xs text-slate-400 line-through font-medium">
                                                            {formatCurrency(origPrice)}
                                                        </span>
                                                    )}
                                                </div>

                                                {countdownStr && (
                                                    <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-indigo-700">
                                                        <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                                                        <span>{countdownStr}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handleOpenEditModal(p)}
                                            variant="outline"
                                            className="w-full justify-center gap-2 rounded-xl text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                            {discountActive ? "Wax ka baddi Discount & Expiry" : "Ku sameey Timed Discount"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Individual Discount Edit Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            Timed Discount u sameey: {selectedProduct?.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Geli boqolleyda, qiimaha, iyo taariiqda uu ku dhacayo discount-ku
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveIndividualDiscount} className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold">Qiimaha Hore (Original Price $)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                required
                                value={origPriceInput}
                                onChange={(e) => setOrigPriceInput(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-indigo-600">Boqolleyda Discount-ka (%)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    placeholder="E.g. 20"
                                    value={customDiscountPercent}
                                    onChange={(e) => handlePercentInputChange(e.target.value)}
                                    className="rounded-xl font-bold"
                                />
                                <span className="font-extrabold text-sm text-slate-700">% OFF</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-emerald-600">Qiimaha Cusub (Sale Price $)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                required
                                value={salePriceInput}
                                onChange={(e) => setSalePriceInput(e.target.value)}
                                className="rounded-xl font-black text-emerald-600"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-amber-700 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> Taariiqda uu ku Dhacayo Discount-ku (Expiry Duration)
                            </Label>
                            <Select value={individualDuration} onValueChange={setIndividualDuration}>
                                <SelectTrigger className="rounded-xl text-xs font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1day">⏳ 1 Maalin (24 Hours)</SelectItem>
                                    <SelectItem value="3days">⚡ 3 Maalmood</SelectItem>
                                    <SelectItem value="7days">📅 7 Maalmood (1 Todobaad)</SelectItem>
                                    <SelectItem value="30days">🗓️ 30 Maalmood (1 Bil)</SelectItem>
                                    <SelectItem value="never">♾️ No Expiration</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            disabled={savingIndividual}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl py-6 text-xs"
                        >
                            {savingIndividual ? "Kaydinayaa..." : "Kaydi Timed Discount-ka"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
