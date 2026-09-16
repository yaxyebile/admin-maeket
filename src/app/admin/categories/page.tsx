"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Layers,
    Plus,
    Search,
    Trash2,
    Edit2,
    Sparkles,
    Zap,
    Shirt,
    ShoppingBag,
    Utensils,
    Home,
    HeartHandshake,
    Smartphone,
    Car,
    Wrench,
    CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export interface CategoryItem {
    id: string;
    name: string;
    icon: string;
    created_at?: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
    { id: "1", name: "Electronics", icon: "bolt" },
    { id: "2", name: "Fashion", icon: "shirt" },
    { id: "3", name: "Groceries", icon: "basket-shopping" },
    { id: "4", name: "Food", icon: "utensils" },
    { id: "5", name: "Beauty", icon: "sparkles" },
    { id: "6", name: "Home", icon: "house" },
    { id: "7", name: "Services", icon: "hand-holding-heart" },
];

const ICON_OPTIONS = [
    { name: "bolt", label: "⚡ Electronics / Bolt", icon: Zap },
    { name: "shirt", label: "👕 Fashion / Shirt", icon: Shirt },
    { name: "basket-shopping", label: "🛒 Groceries / Basket", icon: ShoppingBag },
    { name: "utensils", label: "🍔 Food / Utensils", icon: Utensils },
    { name: "sparkles", label: "✨ Beauty / Sparkles", icon: Sparkles },
    { name: "house", label: "🏠 Home / House", icon: Home },
    { name: "hand-holding-heart", label: "🤝 Services / Care", icon: HeartHandshake },
    { name: "smartphone", label: "📱 Mobile / Tech", icon: Smartphone },
    { name: "car", label: "🚗 Automotive", icon: Car },
    { name: "wrench", label: "🔧 Maintenance / Tools", icon: Wrench },
];

function renderCategoryIcon(iconName: string) {
    switch (iconName?.toLowerCase()) {
        case "bolt":
        case "zap":
            return <Zap className="h-5 w-5 text-amber-500" />;
        case "shirt":
            return <Shirt className="h-5 w-5 text-indigo-500" />;
        case "basket-shopping":
        case "shopping-bag":
            return <ShoppingBag className="h-5 w-5 text-emerald-500" />;
        case "utensils":
            return <Utensils className="h-5 w-5 text-rose-500" />;
        case "sparkles":
            return <Sparkles className="h-5 w-5 text-purple-500" />;
        case "house":
        case "home":
            return <Home className="h-5 w-5 text-blue-500" />;
        case "hand-holding-heart":
            return <HeartHandshake className="h-5 w-5 text-pink-500" />;
        case "smartphone":
            return <Smartphone className="h-5 w-5 text-cyan-500" />;
        case "car":
            return <Car className="h-5 w-5 text-orange-500" />;
        case "wrench":
            return <Wrench className="h-5 w-5 text-slate-600" />;
        default:
            return <Layers className="h-5 w-5 text-sky-500" />;
    }
}

export default function CategoriesAdminPage() {
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
    const [formData, setFormData] = useState({ name: "", icon: "bolt" });
    const [submitting, setSubmitting] = useState(false);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("id", { ascending: true });

            if (error) {
                console.warn("categories query notice:", error.message);
                const saved = localStorage.getItem("emara_categories");
                if (saved) setCategories(JSON.parse(saved));
                else setCategories(DEFAULT_CATEGORIES);
            } else if (data && data.length > 0) {
                setCategories(data);
                localStorage.setItem("emara_categories", JSON.stringify(data));
            } else {
                setCategories(DEFAULT_CATEGORIES);
            }
        } catch (err: any) {
            console.warn("Fetch categories error:", err?.message);
            setCategories(DEFAULT_CATEGORIES);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    function openAddModal() {
        setEditingCat(null);
        setFormData({ name: "", icon: "bolt" });
        setModalOpen(true);
    }

    function openEditModal(cat: CategoryItem) {
        setEditingCat(cat);
        setFormData({ name: cat.name, icon: cat.icon || "bolt" });
        setModalOpen(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Fadlan geli magaca qaybta (Category name)");
            return;
        }

        setSubmitting(true);
        try {
            if (editingCat) {
                // Update existing
                const { error } = await supabase
                    .from("categories")
                    .update({
                        name: formData.name.trim(),
                        icon: formData.icon,
                    })
                    .eq("id", editingCat.id);

                if (error) console.warn("Update notice:", error.message);

                const updated = categories.map((c) =>
                    c.id === editingCat.id
                        ? { ...c, name: formData.name.trim(), icon: formData.icon }
                        : c
                );
                setCategories(updated);
                localStorage.setItem("emara_categories", JSON.stringify(updated));
                toast.success(`✅ Qaybta "${formData.name}" waa la cusbooneysiiyay!`);
            } else {
                // Insert new
                const newId = String(Date.now());
                const newItem: CategoryItem = {
                    id: newId,
                    name: formData.name.trim(),
                    icon: formData.icon,
                };

                const { error } = await supabase.from("categories").insert([newItem]);
                if (error) console.warn("Insert notice:", error.message);

                const updated = [...categories, newItem];
                setCategories(updated);
                localStorage.setItem("emara_categories", JSON.stringify(updated));
                toast.success(`🎉 Qaybta cusub "${formData.name}" waa la abuuray!`);
            }
            setModalOpen(false);
        } catch (err: any) {
            toast.error("Cilad ayaa dhacday: " + err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(catId: string, catName: string) {
        if (!confirm(`Ma hubtaa inaad tirayso qaybta: "${catName}"?`)) return;

        try {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", catId);

            if (error) console.warn("Delete notice:", error.message);

            const updated = categories.filter((c) => c.id !== catId);
            setCategories(updated);
            localStorage.setItem("emara_categories", JSON.stringify(updated));
            toast.success(`🗑️ Qaybta "${catName}" waa la tiray!`);
        } catch (err: any) {
            toast.error("Failed to delete: " + err.message);
        }
    }

    const filteredCategories = categories.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Maareynta Qaybaha (Categories Management)"
                    description="Kala maamul qaybaha alaabta iyo adeegyada nidaamka (Synced with public.categories table)."
                />
                <Button
                    onClick={openAddModal}
                    className="bg-[#00A8E8] hover:bg-[#0092CB] text-white font-extrabold shadow-sm rounded-xl gap-2 self-start sm:self-auto"
                >
                    <Plus className="h-4 w-4 stroke-[3]" /> + Ku Dar Qayb Cusub
                </Button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Search className="h-5 w-5 text-slate-400 ml-2" />
                <Input
                    placeholder="Raadi qaybaha (e.g. Electronics, Fashion, Food)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none focus-visible:ring-0 text-sm"
                />
            </div>

            {/* Categories Grid */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-400 font-bold">
                        Qaybaha waa la soo rarayaa...
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-white rounded-2xl border border-slate-200">
                        Wali wax qayb ah ma jiro. Taabo <b>+ Ku Dar Qayb Cusub</b> si aad u bilowdo.
                    </div>
                ) : (
                    filteredCategories.map((cat) => (
                        <div
                            key={cat.id}
                            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-[#D2F7FF]/70 border border-[#9DE6FF] flex items-center justify-center shrink-0">
                                        {renderCategoryIcon(cat.icon)}
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 group-hover:text-[#00A8E8] transition-colors">
                                            {cat.name}
                                        </h3>
                                        <Badge variant="secondary" className="text-[10px] font-mono mt-1 text-slate-400">
                                            ID: {cat.id}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="font-mono text-slate-400 flex items-center gap-1">
                                    Icon: <code className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-bold">{cat.icon}</code>
                                </span>

                                <div className="flex items-center gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openEditModal(cat)}
                                        className="h-8 w-8 p-0 rounded-xl text-blue-600 hover:bg-blue-50"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(cat.id, cat.name)}
                                        className="h-8 w-8 p-0 rounded-xl text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add / Edit Category Dialog Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-[#00A8E8]" />
                            {editingCat ? "Wax ka badal Qaybta (Edit Category)" : "Ku dar Qayb Cusub (Add Category)"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Geli magaca qaybta iyo icon-ka ku habboon si loogu muujiyo app-ka.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-4 mt-2">
                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-1 block">
                                Magaca Qaybta (Category Name) *
                            </label>
                            <Input
                                placeholder="e.g. Electronics, Fashion, Services..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="rounded-xl border-slate-200 text-sm font-semibold"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-1 block">
                                Door Icon-ka (Category Icon) *
                            </label>
                            <select
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#00A8E8]"
                            >
                                {ICON_OPTIONS.map((opt) => (
                                    <option key={opt.name} value={opt.name}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Icon Preview */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500">Preview:</span>
                            <div className="h-9 w-9 rounded-xl bg-[#D2F7FF] flex items-center justify-center border border-[#9DE6FF]">
                                {renderCategoryIcon(formData.icon)}
                            </div>
                            <span className="text-sm font-extrabold text-slate-800">
                                {formData.name || "Category Name"}
                            </span>
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalOpen(false)}
                                className="rounded-xl font-bold text-xs"
                            >
                                Kansal
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-[#00A8E8] hover:bg-[#0092CB] text-white font-extrabold rounded-xl text-xs px-5 shadow-sm"
                            >
                                {submitting ? "Waa la kaydinayaa..." : editingCat ? "Keydi Badalaada" : "Abuur Qaybta"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
