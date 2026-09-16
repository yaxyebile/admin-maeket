"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    DollarSign,
    Plus,
    CheckCircle,
    Wrench,
    Calendar,
    Users,
    Search,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

export interface TechPricing {
    id: string;
    category: string;
    price_sare: number;
    price_dhex: number;
    price_hoose: number;
    created_at?: string;
    updated_at?: string;
}

const DEFAULT_PRICING: TechPricing[] = [
    { id: "1", category: "Korontada", price_sare: 50.0, price_dhex: 30.0, price_hoose: 15.0 },
    { id: "2", category: "Qaboojiyaha (AC)", price_sare: 60.0, price_dhex: 40.0, price_hoose: 25.0 },
    { id: "3", category: "Qasaaladaha", price_sare: 45.0, price_dhex: 30.0, price_hoose: 20.0 },
    { id: "4", category: "Tuubooyinka (Plumbing)", price_sare: 40.0, price_dhex: 25.0, price_hoose: 15.0 },
    { id: "5", category: "Solar & Batteriga", price_sare: 70.0, price_dhex: 45.0, price_hoose: 30.0 },
    { id: "6", category: "Xirfadaha kale", price_sare: 50.0, price_dhex: 30.0, price_hoose: 15.0 },
];

export default function TechnicianPricingPage() {
    const [pricingList, setPricingList] = useState<TechPricing[]>(DEFAULT_PRICING);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [newCatName, setNewCatName] = useState("");
    const [newPriceSare, setNewPriceSare] = useState("50.00");
    const [newPriceDhex, setNewPriceDhex] = useState("30.00");
    const [newPriceHoose, setNewPriceHoose] = useState("15.00");

    const loadPricing = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("tech_pricing")
                .select("*")
                .order("category", { ascending: true });

            if (error) {
                console.warn("tech_pricing notice:", error.message);
                const saved = localStorage.getItem("emara_tech_pricing");
                if (saved) setPricingList(JSON.parse(saved));
            } else if (data && data.length > 0) {
                setPricingList(data as TechPricing[]);
            } else {
                setPricingList(DEFAULT_PRICING);
            }
        } catch (e) {
            console.warn("Could not load tech_pricing:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPricing();
    }, [loadPricing]);

    const savePricingItem = async (
        item: TechPricing,
        field: "price_sare" | "price_dhex" | "price_hoose",
        val: number
    ) => {
        const updated = pricingList.map((p) => (p.category === item.category ? { ...p, [field]: val } : p));
        setPricingList(updated);
        localStorage.setItem("emara_tech_pricing", JSON.stringify(updated));

        try {
            const { error } = await supabase
                .from("tech_pricing")
                .upsert({
                    category: item.category,
                    price_sare: field === "price_sare" ? val : item.price_sare,
                    price_dhex: field === "price_dhex" ? val : item.price_dhex,
                    price_hoose: field === "price_hoose" ? val : item.price_hoose,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "category" });

            if (error) console.warn("tech_pricing upsert notice:", error.message);
            toast.success(`Qiimaha ${item.category} waa la cusboonaysiiyay!`);
        } catch (err: any) {
            toast.error("Error updating price: " + err.message);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) {
            toast.error("Fadlan magac u yeel qaybta cusub!");
            return;
        }

        const newItem: TechPricing = {
            id: "p_" + Date.now(),
            category: newCatName,
            price_sare: parseFloat(newPriceSare) || 50,
            price_dhex: parseFloat(newPriceDhex) || 30,
            price_hoose: parseFloat(newPriceHoose) || 15,
        };

        try {
            const { error } = await supabase.from("tech_pricing").insert([{
                category: newItem.category,
                price_sare: newItem.price_sare,
                price_dhex: newItem.price_dhex,
                price_hoose: newItem.price_hoose,
            }]);

            if (error) console.warn(error.message);

            const updated = [...pricingList, newItem];
            setPricingList(updated);
            localStorage.setItem("emara_tech_pricing", JSON.stringify(updated));

            toast.success("➕ Qayb cusub oo farsamo waa la ku dhuftay!");
            setNewCatName("");
            setNewPriceSare("50.00");
            setNewPriceDhex("30.00");
            setNewPriceHoose("15.00");
            setShowAddModal(false);
        } catch (err: any) {
            toast.error("Failed to add category: " + err.message);
        }
    };

    const handleDeleteCategory = async (category: string) => {
        if (!confirm("Ma cinwaansan tahay inaad tirtirto qaybtaan?")) return;
        const updated = pricingList.filter((c) => c.category !== category);
        setPricingList(updated);
        localStorage.setItem("emara_tech_pricing", JSON.stringify(updated));

        try {
            await supabase.from("tech_pricing").delete().eq("category", category);
        } catch (e) { }

        toast.success("Qaybta waa la tirtiray.");
    };

    const filteredPricing = pricingList.filter((p) =>
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Badalaada & Ku Dardaanka Qiimaha Farsamada (Farsamo Pricing)"
                    description="Maamul qiimaha lagaga qaado macmiilka heer kasta oo farsamo (Heer Sare, Dhex Dhexaad, Hoose)."
                />
                <Button
                    onClick={() => setShowAddModal(!showAddModal)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold gap-2 self-start sm:self-auto shadow-sm"
                >
                    <Plus className="h-4 w-4" /> + Ku dar Qayb Cusub (Add Category)
                </Button>
            </div>

            {/* Navigation Quick Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-sm font-bold">
                <Link
                    href="/admin/technicians"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                    <Users className="h-4 w-4" /> 👨‍🔧 Farsamo Yaqaanno
                </Link>
                <Link
                    href="/admin/technicians/pricing"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white shadow-sm flex items-center gap-2"
                >
                    <DollarSign className="h-4 w-4" /> 💵 Lacagaha Farsamada (Rates)
                </Link>
                <Link
                    href="/admin/technicians/bookings"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                    <Calendar className="h-4 w-4 text-purple-600" /> 📅 Dalabyada (Bookings)
                </Link>
            </div>

            {/* Live Search Bar */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Search className="h-5 w-5 text-slate-400 ml-2" />
                <Input
                    placeholder="Raadi qaybaha farsamada (e.g. Korontada, AC, Tuubooyinka)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none focus-visible:ring-0 text-sm"
                />
            </div>

            {/* Add New Category Modal Form */}
            {showAddModal && (
                <Card className="border-emerald-200 shadow-md bg-emerald-50/40 rounded-2xl">
                    <CardContent className="p-6">
                        <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2 border-b border-emerald-200/60 pb-3">
                            <Plus className="h-5 w-5 text-emerald-600" /> Ku Dar Qayb Cusub Oo Farsamo (New Category)
                        </h3>

                        <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 md:col-span-2">
                                <Label className="font-bold text-slate-700">Magaca Qaybta Farsamada (Category) *</Label>
                                <Input
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    placeholder="e.g. CCTV & Systems Security"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="font-bold text-slate-700">🥇 Qiimaha Heer Sare ($ price_sare)</Label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    value={newPriceSare}
                                    onChange={(e) => setNewPriceSare(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="font-bold text-slate-700">🥈 Qiimaha Dhex Dhexaad ($ price_dhex)</Label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    value={newPriceDhex}
                                    onChange={(e) => setNewPriceDhex(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <Label className="font-bold text-slate-700">🥉 Qiimaha Heer Hoose ($ price_hoose)</Label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    value={newPriceHoose}
                                    onChange={(e) => setNewPriceHoose(e.target.value)}
                                />
                            </div>

                            <div className="md:col-span-2 pt-2 flex gap-3 justify-end border-t border-emerald-200/60">
                                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                                    Kansal
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold gap-2">
                                    <CheckCircle className="h-4 w-4" /> Ku Dar Qaybtaan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Pricing Cards */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-400 font-bold">Lacagaha farsamada waa la soo rarayaa...</div>
                ) : filteredPricing.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        Wax qayb farsamo ah oo meeshaan lagu helay ma jiro.
                    </div>
                ) : (
                    filteredPricing.map((item) => (
                        <Card key={item.category} className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                    <div>
                                        <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                            <Wrench className="h-5 w-5 text-emerald-600" />
                                            {item.category}
                                        </h4>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:bg-red-50 hover:text-red-600 font-bold gap-1 text-xs"
                                        onClick={() => handleDeleteCategory(item.category)}
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete Category
                                    </Button>
                                </div>

                                {/* 3 Tier Rates Matrix */}
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {/* 1. Senior Rate (price_sare) */}
                                    <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
                                                🥇 Heer Sare (Senior)
                                            </span>
                                            <Badge className="bg-amber-600 text-white text-[10px] font-bold">price_sare</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <span className="font-bold text-slate-500 text-sm">$</span>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                value={item.price_sare}
                                                onChange={(e) =>
                                                    savePricingItem(item, "price_sare", parseFloat(e.target.value) || 0)
                                                }
                                                className="font-black text-amber-900 font-mono text-base bg-white"
                                            />
                                            <span className="text-xs text-slate-400 font-bold">/hr</span>
                                        </div>
                                    </div>

                                    {/* 2. Intermediate Rate (price_dhex) */}
                                    <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase text-purple-800 tracking-wider flex items-center gap-1">
                                                🥈 Dhex Dhexaad
                                            </span>
                                            <Badge className="bg-purple-600 text-white text-[10px] font-bold">price_dhex</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <span className="font-bold text-slate-500 text-sm">$</span>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                value={item.price_dhex}
                                                onChange={(e) =>
                                                    savePricingItem(item, "price_dhex", parseFloat(e.target.value) || 0)
                                                }
                                                className="font-black text-purple-900 font-mono text-base bg-white"
                                            />
                                            <span className="text-xs text-slate-400 font-bold">/hr</span>
                                        </div>
                                    </div>

                                    {/* 3. Junior Rate (price_hoose) */}
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1">
                                                🥉 Heer Hoose (Junior)
                                            </span>
                                            <Badge variant="secondary" className="text-[10px] font-bold">price_hoose</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <span className="font-bold text-slate-500 text-sm">$</span>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                value={item.price_hoose}
                                                onChange={(e) =>
                                                    savePricingItem(item, "price_hoose", parseFloat(e.target.value) || 0)
                                                }
                                                className="font-black text-slate-900 font-mono text-base bg-white"
                                            />
                                            <span className="text-xs text-slate-400 font-bold">/hr</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
