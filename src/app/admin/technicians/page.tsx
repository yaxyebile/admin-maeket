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
    Wrench,
    Phone,
    Plus,
    Trash2,
    Edit,
    MapPin,
    Award,
    Search,
    DollarSign,
    Calendar,
    Users,
    X,
    CheckCircle,
    Youtube,
    Play,
    Sparkles,
    ExternalLink,
    Video,
    Save,
} from "lucide-react";
import { toast } from "sonner";
import {
    getTechnicianPromoSettings,
    saveTechnicianPromoSettings,
    getYouTubeEmbedUrl,
    getYouTubeVideoId,
    detectYouTubeUrlType,
    DEFAULT_TECHNICIAN_PROMO,
    type TechnicianPromoSettings,
} from "@/lib/technician-promo";

export interface Technician {
    id: string;
    name: string;
    phone: string;
    location?: string;
    specialty: string;
    level?: string;
    is_active: boolean;
    created_at?: string;
}

export default function TechniciansPage() {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTech, setEditingTech] = useState<Technician | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Promo Video States
    const [promo, setPromo] = useState<TechnicianPromoSettings>(DEFAULT_TECHNICIAN_PROMO);
    const [showEditPromoModal, setShowEditPromoModal] = useState(false);
    const [promoUrl, setPromoUrl] = useState(DEFAULT_TECHNICIAN_PROMO.videoUrl);
    const [promoTitle, setPromoTitle] = useState(DEFAULT_TECHNICIAN_PROMO.title);
    const [promoDesc, setPromoDesc] = useState(DEFAULT_TECHNICIAN_PROMO.desc);
    const [promoTag, setPromoTag] = useState(DEFAULT_TECHNICIAN_PROMO.tag);
    const [savingPromo, setSavingPromo] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [specialty, setSpecialty] = useState("Korontada");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("Hodan, Mogadishu");
    const [level, setLevel] = useState<string>("Heer Sare");

    const fetchTechnicians = useCallback(async () => {
        setLoading(true);
        try {
            // Load technicians
            const { data, error } = await supabase
                .from("technicians")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.warn("technicians query notice:", error.message);
                const saved = localStorage.getItem("emara_technicians");
                if (saved) setTechnicians(JSON.parse(saved));
            } else {
                setTechnicians(data || []);
            }

            // Load promo settings
            const promoSettings = await getTechnicianPromoSettings();
            setPromo(promoSettings);
            setPromoUrl(promoSettings.videoUrl);
            setPromoTitle(promoSettings.title);
            setPromoDesc(promoSettings.desc);
            setPromoTag(promoSettings.tag);
        } catch (err: any) {
            console.warn("Error loading technicians:", err?.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTechnicians();
    }, [fetchTechnicians]);

    async function toggleAvailability(id: string, currentActive: boolean) {
        try {
            const { error } = await supabase
                .from("technicians")
                .update({ is_active: !currentActive })
                .eq("id", id);

            if (error) console.warn(error.message);

            const updated = technicians.map((t) => (t.id === id ? { ...t, is_active: !currentActive } : t));
            setTechnicians(updated);
            localStorage.setItem("emara_technicians", JSON.stringify(updated));

            toast.success("Xaalada farsamo yaqaanka waa la cusboonaysiiyay");
        } catch (err: any) {
            toast.error("Failed to toggle status: " + err.message);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Ma cinwaansan tahay inaad tirtirto farsamo yaqaankan?")) return;
        try {
            const { error } = await supabase.from("technicians").delete().eq("id", id);
            if (error) console.warn(error.message);

            const updated = technicians.filter((t) => t.id !== id);
            setTechnicians(updated);
            localStorage.setItem("emara_technicians", JSON.stringify(updated));

            toast.success("Farsamo yaqaanka waa la tirtiray!");
        } catch (err: any) {
            toast.error("Failed to delete technician: " + err.message);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!name || !specialty || !phone) {
            toast.error("Fadlan buuxi magaca, xirfadda, iyo nambarka telefoonka.");
            return;
        }

        try {
            if (editingTech) {
                // Edit existing technician
                const { error } = await supabase
                    .from("technicians")
                    .update({
                        name,
                        specialty,
                        phone,
                        location: location || "Mogadishu",
                        level: level || "Dhex Dhexaad",
                    })
                    .eq("id", editingTech.id);

                if (error) console.warn(error.message);

                const updated = technicians.map((t) =>
                    t.id === editingTech.id
                        ? { ...t, name, specialty, phone, location, level }
                        : t
                );
                setTechnicians(updated);
                localStorage.setItem("emara_technicians", JSON.stringify(updated));

                toast.success("✏️ Macluumaadka farsamo yaqaanka waa la cusboonaysiiyay!");
                setEditingTech(null);
            } else {
                // Create new technician
                const newTech: Technician = {
                    id: "tech_" + Date.now(),
                    name,
                    specialty,
                    phone,
                    location: location || "Mogadishu",
                    level: level || "Dhex Dhexaad",
                    is_active: true,
                };

                const { error } = await supabase.from("technicians").insert([newTech]);
                if (error) console.warn(error.message);

                const updated = [newTech, ...technicians];
                setTechnicians(updated);
                localStorage.setItem("emara_technicians", JSON.stringify(updated));

                toast.success("✅ Farsamo yaqaan cusub waa la diiwaangaliyay!");
                setShowAddForm(false);
            }

            resetForm();
        } catch (err: any) {
            toast.error("Error saving technician: " + err.message);
        }
    }

    function startEdit(tech: Technician) {
        setEditingTech(tech);
        setName(tech.name || "");
        setSpecialty(tech.specialty || "Korontada");
        setPhone(tech.phone || "");
        setLocation(tech.location || "Mogadishu");
        setLevel(tech.level || "Heer Sare");
        setShowAddForm(false);
    }

    function resetForm() {
        setName("");
        setSpecialty("Korontada");
        setPhone("");
        setLocation("Hodan, Mogadishu");
        setLevel("Heer Sare");
        setEditingTech(null);
    }

    const filteredTechnicians = technicians.filter((t) =>
        (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.specialty || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.phone || "").includes(searchTerm) ||
        (t.location || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSavePromo = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const videoId = getYouTubeVideoId(promoUrl);
        if (!videoId) {
            toast.error("Fadlan geli link YouTube sax ah (Shorts, Watch ama Embed).");
            return;
        }

        setSavingPromo(true);
        try {
            const updated = {
                videoUrl: promoUrl.trim(),
                title: promoTitle.trim() || DEFAULT_TECHNICIAN_PROMO.title,
                desc: promoDesc.trim() || DEFAULT_TECHNICIAN_PROMO.desc,
                tag: promoTag.trim() || DEFAULT_TECHNICIAN_PROMO.tag,
            };

            await saveTechnicianPromoSettings(updated);
            setPromo(updated);
            setShowEditPromoModal(false);
            toast.success("✅ Xayeysiiska muuqaalka farsamada waa la cusboonaysiiyay!");
        } catch (err: any) {
            toast.error("Failed to save promo: " + err.message);
        } finally {
            setSavingPromo(false);
        }
    };

    const promoVideoId = getYouTubeVideoId(promo.videoUrl);
    const promoEmbedUrl = getYouTubeEmbedUrl(promo.videoUrl);
    const modalVideoId = getYouTubeVideoId(promoUrl);
    const modalEmbedUrl = getYouTubeEmbedUrl(promoUrl);

    return (
        <div className="space-y-6 pb-12">
            {/* Top Header & Sub-Navigation Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Diiwaangali & Maamul Farsamo Yaqaannada"
                    description="Wax ka bixi macluumaadka farsamo yaqaannada, goobaha ay ku sugan yihiin, iyo heerarkooda."
                />
                <Button
                    onClick={() => {
                        resetForm();
                        setShowAddForm(!showAddForm);
                    }}
                    className="bg-primary text-white font-bold gap-2 self-start sm:self-auto shadow-sm"
                >
                    <Plus className="h-4 w-4" /> Diiwaangali Farsamo Yaqaan
                </Button>
            </div>

            {/* Navigation Quick Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-sm font-bold overflow-x-auto">
                <Link
                    href="/admin/technicians"
                    className="px-4 py-2 rounded-xl bg-primary text-white shadow-sm flex items-center gap-2 whitespace-nowrap"
                >
                    <Users className="h-4 w-4" /> 👨‍🔧 Farsamo Yaqaanno ({technicians.length})
                </Link>
                <Link
                    href="/admin/technicians/pricing"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                    <DollarSign className="h-4 w-4 text-emerald-600" /> 💵 Lacagaha Farsamada (Rates)
                </Link>
                <Link
                    href="/admin/technicians/bookings"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                    <Calendar className="h-4 w-4 text-purple-600" /> 📅 Dalabyada (Bookings)
                </Link>
                <Link
                    href="/admin/technicians/promo"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                    <span className="text-red-600 font-bold">🎬</span> Promo Video (Xayeysiin)
                </Link>
            </div>

            {/* FEATURED: PROMOTIONAL YOUTUBE VIDEO AD CARD (WITH BADAL / EDIT BUTTON) */}
            <div className="rounded-2xl border border-red-200/80 bg-gradient-to-r from-red-50/70 via-white to-slate-50 p-4 sm:p-5 shadow-sm space-y-4">
                {/* Header row with Badal / Edit Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-200">
                            <Youtube className="h-5 w-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase text-red-900 tracking-wider">
                                    Muuqaalka Xayeysiiska Farsamada (YouTube Promo Ad)
                                </span>
                                <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] font-black uppercase tracking-wider">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse mr-1 inline-block" />
                                    {promo.tag || "WAAFI PAY API INTEGRATED"}
                                </Badge>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                                Toos looga aqrinayaa Supabase database-ka • Ka muuqda qaybta Farsamo Yaqaano
                            </span>
                        </div>
                    </div>

                    {/* Quick In-App Edit Button */}
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => {
                                setPromoUrl(promo.videoUrl);
                                setPromoTitle(promo.title);
                                setPromoDesc(promo.desc);
                                setPromoTag(promo.tag);
                                setShowEditPromoModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-sm gap-1.5 cursor-pointer"
                        >
                            <Edit className="h-3.5 w-3.5" /> Badal / Edit ✏️
                        </Button>
                        <Link
                            href="/admin/technicians/promo"
                            className="text-xs font-bold text-slate-600 hover:text-red-600 hover:underline px-2 py-1 rounded transition-colors hidden sm:inline-flex items-center gap-1"
                        >
                            Studio <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                </div>

                {/* Promo Card Body */}
                <div className="grid gap-4 md:grid-cols-12 items-center">
                    {/* Embedded 16:9 Video Player */}
                    <div className="md:col-span-5 lg:col-span-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video relative shadow-inner">
                        {promoVideoId ? (
                            <iframe
                                src={promoEmbedUrl}
                                title={promo.title}
                                className="absolute inset-0 w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                                Muuqaal ma diyaarsana
                            </div>
                        )}
                    </div>

                    {/* Text Details & Controls */}
                    <div className="md:col-span-7 lg:col-span-8 space-y-2">
                        <h4 className="text-base font-black text-slate-900 tracking-tight">
                            {promo.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                            {promo.desc}
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200 truncate max-w-xs">
                                🔗 {promo.videoUrl}
                            </span>
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Live & Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* IN-APP QUICK EDIT MODAL (BADAL / EDIT POPUP) */}
            {showEditPromoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-50">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Youtube className="h-5 w-5" />
                                <h3 className="font-extrabold text-base">
                                    Wax Ka Bedel Xayeysiiska Muuqaalka (Quick Edit)
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowEditPromoModal(false)}
                                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSavePromo} className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* YouTube URL */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>YouTube Link * (Shorts, Watch, ama Embed)</span>
                                    {modalVideoId && (
                                        <span className="text-emerald-600 font-mono text-[11px]">
                                            ID: {modalVideoId}
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    value={promoUrl}
                                    onChange={(e) => setPromoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=fq4N0hgOWzU"
                                    className="font-mono text-xs"
                                    required
                                />
                            </div>

                            {/* Live Preview inside Modal */}
                            {modalVideoId && (
                                <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-black relative max-h-48 mx-auto">
                                    <iframe
                                        src={modalEmbedUrl}
                                        title="Preview"
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            )}

                            {/* Title */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">
                                    Cinwaanka Xayeysiiska (Title) *
                                </Label>
                                <Input
                                    value={promoTitle}
                                    onChange={(e) => setPromoTitle(e.target.value)}
                                    placeholder="Farsamo Yaqaano Xirfad Leh"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">
                                    Faahfaahinta (Description)
                                </Label>
                                <textarea
                                    value={promoDesc}
                                    onChange={(e) => setPromoDesc(e.target.value)}
                                    placeholder="Dooro adeegga aad u baahan tahay, si automatic ahna ugu bixi EVC Plus."
                                    className="w-full min-h-[70px] p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={2}
                                />
                            </div>

                            {/* Tag */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">
                                    Calaamadda / Badge Tag
                                </Label>
                                <Input
                                    value={promoTag}
                                    onChange={(e) => setPromoTag(e.target.value)}
                                    placeholder="WAAFI PAY API INTEGRATED"
                                    className="font-mono uppercase text-xs"
                                />
                            </div>

                            {/* Footer Buttons */}
                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowEditPromoModal(false)}
                                    className="text-xs"
                                >
                                    Kansal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={savingPromo}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs gap-1.5 px-5"
                                >
                                    <Save className="h-4 w-4" />
                                    {savingPromo ? "Keydinaya..." : "Keydi Badalaada (Save)"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Search Filter Bar */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Search className="h-5 w-5 text-slate-400 ml-2" />
                <Input
                    placeholder="Raadi magaca farsamo yaqaanka, xirfadda, telefoonka ama degmada/goobta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none focus-visible:ring-0 text-sm"
                />
            </div>

            {/* Registration / Edit Form Modal */}
            {(showAddForm || editingTech) && (
                <Card className="border-blue-200 shadow-md bg-blue-50/40 rounded-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4 border-b border-blue-200/60 pb-3">
                            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                {editingTech ? (
                                    <>
                                        <Edit className="h-5 w-5 text-blue-600" /> Wax Ka Bixi Macluumaadka Farsamo Yaqaanka (Edit)
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-5 w-5 text-emerald-600" /> Diiwaangali Farsamo Yaqaan Cusub
                                    </>
                                )}
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingTech(null);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="font-bold text-slate-700">Magaca Farsamo Yaqaanka *</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="e.g. Insinyuur Axmed Cali"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="font-bold text-slate-700">Taleefanka *</Label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    placeholder="e.g. +252615123456"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="font-bold text-slate-700">Goobta / Degmada (Location) *</Label>
                                <Input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                    placeholder="e.g. Hodan, Bakaara, Mogadishu"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="font-bold text-slate-700">Xirfadda (Specialty) *</Label>
                                <select
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="Korontada">⚡ Korontada</option>
                                    <option value="Qaboojiyaha (AC)">❄️ Qaboojiyaha (AC)</option>
                                    <option value="Qasaaladaha">🧺 Qasaaladaha</option>
                                    <option value="Tuubooyinka (Plumbing)">🚰 Tuubooyinka (Plumbing)</option>
                                    <option value="Solar & Batteriga">☀️ Solar & Batteriga</option>
                                    <option value="Xirfadaha kale">🛠️ Xirfadaha kale</option>
                                </select>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <Label className="font-bold text-slate-700">Heerkiisa (Skill Level) *</Label>
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="Heer Sare">🥇 Heer Sare (Senior)</option>
                                    <option value="Dhex Dhexaad">🥈 Dhex Dhexaad (Mid-Level)</option>
                                    <option value="Hoose">🥉 Heer Hoose (Junior)</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 pt-2 flex gap-3 justify-end border-t border-blue-200/60">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setEditingTech(null);
                                    }}
                                >
                                    Kansal
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {editingTech ? "Kaydi Badalaada (Save Changes)" : "Diiwaangali (Register)"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Directory Grid */}
            {loading ? (
                <div className="py-12 flex justify-center text-slate-400 font-bold">Moodeelka farsamo yaqaannada waa la soo rarayaa...</div>
            ) : filteredTechnicians.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 font-medium">
                    Wali farsamo yaqaan diiwaangashan ma jiro.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTechnicians.map((t) => (
                        <Card
                            key={t.id}
                            className="bg-white border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden rounded-2xl"
                        >
                            <div className={`absolute top-0 left-0 w-2 h-full ${t.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                            <CardContent className="p-5 pl-7 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-black text-slate-900 text-base">{t.name}</h4>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-bold text-[10px]">
                                                {t.specialty}
                                            </Badge>
                                            <Badge
                                                className={`text-[10px] font-bold ${t.level === "Heer Sare"
                                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                                    : t.level === "Dhex Dhexaad"
                                                        ? "bg-purple-100 text-purple-800 border-purple-200"
                                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                                    }`}
                                            >
                                                <Award className="h-3 w-3 mr-1 inline" />
                                                {t.level || "Dhex Dhexaad"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Actions: BLUE EDIT BUTTON ✏️ & DELETE BUTTON */}
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white font-bold gap-1 text-xs"
                                            onClick={() => startEdit(t)}
                                        >
                                            <Edit className="h-3.5 w-3.5" /> Edit ✏️
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(t.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3 text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="font-mono">{t.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{t.location || "Mogadishu"}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-600">Fursada Shaqada</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black ${t.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                                            {t.is_active ? "ACTIVE" : "OFFLINE"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => toggleAvailability(t.id, t.is_active)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${t.is_active ? "bg-emerald-500" : "bg-slate-300"
                                                }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${t.is_active ? "translate-x-4" : "translate-x-0"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
