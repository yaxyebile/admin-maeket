"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Youtube,
    Play,
    Save,
    RotateCcw,
    Sparkles,
    ExternalLink,
    CheckCircle2,
    Copy,
    Layers,
    Eye,
    Video,
    Wrench,
    Home,
    Tags,
    Loader2,
    Info,
    ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
    getAllPromoVideoSettings,
    saveTechnicianPromoSettings,
    savePropertyPromoSettings,
    saveSecondHandPromoSettings,
    getYouTubeEmbedUrl,
    getYouTubeVideoId,
    detectYouTubeUrlType,
    DEFAULT_TECHNICIAN_PROMO,
    DEFAULT_PROPERTY_PROMO,
    DEFAULT_SECONDHAND_PROMO,
    type PromoVideoSettings,
} from "@/lib/promo-videos";

interface PromoVideosManagerProps {
    initialTab?: "technicians" | "real-estate" | "second-hand";
    lockedTab?: "real-estate" | "second-hand";
    hideRealEstate?: boolean;
    hideSecondHand?: boolean;
    hideSectionLink?: boolean;
}

export function PromoVideosManager({ initialTab = "technicians", lockedTab, hideRealEstate = false, hideSecondHand = false, hideSectionLink = false }: PromoVideosManagerProps) {
    const [activeTab, setActiveTab] = useState<"technicians" | "real-estate" | "second-hand">(lockedTab ?? initialTab);

    // Form states for Technicians
    const [techVideoUrl, setTechVideoUrl] = useState(DEFAULT_TECHNICIAN_PROMO.videoUrl);
    const [techTitle, setTechTitle] = useState(DEFAULT_TECHNICIAN_PROMO.title);
    const [techDesc, setTechDesc] = useState(DEFAULT_TECHNICIAN_PROMO.desc);
    const [techTag, setTechTag] = useState(DEFAULT_TECHNICIAN_PROMO.tag);

    // Form states for Real Estate
    const [propVideoUrl, setPropVideoUrl] = useState(DEFAULT_PROPERTY_PROMO.videoUrl);
    const [propTitle, setPropTitle] = useState(DEFAULT_PROPERTY_PROMO.title);
    const [propDesc, setPropDesc] = useState(DEFAULT_PROPERTY_PROMO.desc);
    const [propTag, setPropTag] = useState(DEFAULT_PROPERTY_PROMO.tag);

    // Form states for Second-Hand
    const [secondVideoUrl, setSecondVideoUrl] = useState(DEFAULT_SECONDHAND_PROMO.videoUrl);
    const [secondTitle, setSecondTitle] = useState(DEFAULT_SECONDHAND_PROMO.title);
    const [secondDesc, setSecondDesc] = useState(DEFAULT_SECONDHAND_PROMO.desc);
    const [secondTag, setSecondTag] = useState(DEFAULT_SECONDHAND_PROMO.tag);

    const [loading, setLoading] = useState(true);
    const [savingTech, setSavingTech] = useState(false);
    const [savingProp, setSavingProp] = useState(false);
    const [savingSecond, setSavingSecond] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);

    // 1. Fetch Logic: Query app_settings on mount for all 3 categories with fallbacks
    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("app_settings")
                .select("key, value")
                .in("key", [
                    "technician_ad_video_url",
                    "technician_ad_title",
                    "technician_ad_desc",
                    "technician_ad_tag",
                    "property_ad_video_url",
                    "property_ad_title",
                    "property_ad_desc",
                    "property_ad_tag",
                    "secondhand_ad_video_url",
                    "secondhand_ad_title",
                    "secondhand_ad_desc",
                    "secondhand_ad_tag",
                ]);

            if (!error && data && data.length > 0) {
                const map: Record<string, string> = {};
                data.forEach((row) => {
                    map[row.key] = row.value;
                });

                // Technicians
                setTechVideoUrl(map["technician_ad_video_url"]?.trim() || DEFAULT_TECHNICIAN_PROMO.videoUrl);
                setTechTitle(map["technician_ad_title"]?.trim() || DEFAULT_TECHNICIAN_PROMO.title);
                setTechDesc(map["technician_ad_desc"]?.trim() || DEFAULT_TECHNICIAN_PROMO.desc);
                setTechTag(map["technician_ad_tag"]?.trim() || DEFAULT_TECHNICIAN_PROMO.tag);

                // Real Estate / Property
                setPropVideoUrl(map["property_ad_video_url"]?.trim() || DEFAULT_PROPERTY_PROMO.videoUrl);
                setPropTitle(map["property_ad_title"]?.trim() || DEFAULT_PROPERTY_PROMO.title);
                setPropDesc(map["property_ad_desc"]?.trim() || DEFAULT_PROPERTY_PROMO.desc);
                setPropTag(map["property_ad_tag"]?.trim() || DEFAULT_PROPERTY_PROMO.tag);

                // Second-Hand
                setSecondVideoUrl(map["secondhand_ad_video_url"]?.trim() || DEFAULT_SECONDHAND_PROMO.videoUrl);
                setSecondTitle(map["secondhand_ad_title"]?.trim() || DEFAULT_SECONDHAND_PROMO.title);
                setSecondDesc(map["secondhand_ad_desc"]?.trim() || DEFAULT_SECONDHAND_PROMO.desc);
                setSecondTag(map["secondhand_ad_tag"]?.trim() || DEFAULT_SECONDHAND_PROMO.tag);
            } else {
                // Fallbacks
                const local = await getAllPromoVideoSettings();
                setTechVideoUrl(local.technician.videoUrl);
                setTechTitle(local.technician.title);
                setTechDesc(local.technician.desc);
                setTechTag(local.technician.tag);

                setPropVideoUrl(local.property.videoUrl);
                setPropTitle(local.property.title);
                setPropDesc(local.property.desc);
                setPropTag(local.property.tag);

                setSecondVideoUrl(local.secondhand.videoUrl);
                setSecondTitle(local.secondhand.title);
                setSecondDesc(local.secondhand.desc);
                setSecondTag(local.secondhand.tag);
            }
        } catch (err: any) {
            toast.error("Khalad soo dejinta xogta: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Current active values according to tab
    const currentVideoUrl =
        activeTab === "technicians"
            ? techVideoUrl
            : activeTab === "real-estate"
                ? propVideoUrl
                : secondVideoUrl;

    const currentTitle =
        activeTab === "technicians"
            ? techTitle
            : activeTab === "real-estate"
                ? propTitle
                : secondTitle;

    const currentDesc =
        activeTab === "technicians"
            ? techDesc
            : activeTab === "real-estate"
                ? propDesc
                : secondDesc;

    const currentTag =
        activeTab === "technicians"
            ? techTag
            : activeTab === "real-estate"
                ? propTag
                : secondTag;

    const currentVideoId = getYouTubeVideoId(currentVideoUrl);
    const currentEmbedUrl = getYouTubeEmbedUrl(currentVideoUrl);
    const currentUrlType = detectYouTubeUrlType(currentVideoUrl);

    // Tab Colors & Theme
    const themeColor =
        activeTab === "technicians"
            ? "red"
            : activeTab === "real-estate"
                ? "emerald"
                : "amber";

    // 2. Save / Upsert Logic for Technicians
    const handleSaveTechnician = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!techVideoUrl.trim()) {
            toast.error("Fadlan geli link-ga YouTube ee Farsamo Yaqaannada.");
            return;
        }
        const id = getYouTubeVideoId(techVideoUrl);
        if (!id) {
            toast.error("Link-ga YouTube ma saxna! Hubi inuu yahay Shorts, Watch ama Embed URL.");
            return;
        }

        setSavingTech(true);
        try {
            const payload: PromoVideoSettings = {
                videoUrl: techVideoUrl.trim(),
                title: techTitle.trim() || DEFAULT_TECHNICIAN_PROMO.title,
                desc: techDesc.trim() || DEFAULT_TECHNICIAN_PROMO.desc,
                tag: techTag.trim() || DEFAULT_TECHNICIAN_PROMO.tag,
            };

            const { error } = await supabase.from("app_settings").upsert(
                [
                    { key: "technician_ad_video_url", value: payload.videoUrl },
                    { key: "technician_ad_title", value: payload.title },
                    { key: "technician_ad_desc", value: payload.desc },
                    { key: "technician_ad_tag", value: payload.tag },
                ],
                { onConflict: "key" }
            );

            if (error) {
                toast.error("Khalad keydinta: " + error.message);
            } else {
                toast.success("✅ Muuqaalka Xayeysiiska Farsamo Yaqaanno si guul leh ayaa loo keydiyay!");
                setPreviewKey((k) => k + 1);
                saveTechnicianPromoSettings(payload);
            }
        } catch (err: any) {
            toast.error("Khalad keydinta: " + err.message);
        } finally {
            setSavingTech(false);
        }
    };

    // 2. Save / Upsert Logic for Real Estate / Property
    const handleSaveProperty = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!propVideoUrl.trim()) {
            toast.error("Fadlan geli link-ga YouTube ee Guryaha & Dhulka.");
            return;
        }
        const id = getYouTubeVideoId(propVideoUrl);
        if (!id) {
            toast.error("Link-ga YouTube ma saxna! Hubi inuu yahay Shorts, Watch ama Embed URL.");
            return;
        }

        setSavingProp(true);
        try {
            const payload: PromoVideoSettings = {
                videoUrl: propVideoUrl.trim(),
                title: propTitle.trim() || DEFAULT_PROPERTY_PROMO.title,
                desc: propDesc.trim() || DEFAULT_PROPERTY_PROMO.desc,
                tag: propTag.trim() || DEFAULT_PROPERTY_PROMO.tag,
            };

            const { error } = await supabase.from("app_settings").upsert(
                [
                    { key: "property_ad_video_url", value: payload.videoUrl },
                    { key: "property_ad_title", value: payload.title },
                    { key: "property_ad_desc", value: payload.desc },
                    { key: "property_ad_tag", value: payload.tag },
                ],
                { onConflict: "key" }
            );

            if (error) {
                toast.error("Khalad keydinta: " + error.message);
            } else {
                toast.success("✅ Muuqaalka Xayeysiiska Guryaha & Dhulka si guul leh ayaa loo keydiyay!");
                setPreviewKey((k) => k + 1);
                savePropertyPromoSettings(payload);
            }
        } catch (err: any) {
            toast.error("Khalad keydinta: " + err.message);
        } finally {
            setSavingProp(false);
        }
    };

    // 2. Save / Upsert Logic for Second-Hand (Suuqa Casriga)
    const handleSaveSecondHand = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!secondVideoUrl.trim()) {
            toast.error("Fadlan geli link-ga YouTube ee Suuqa Casriga (Second-Hand).");
            return;
        }
        const id = getYouTubeVideoId(secondVideoUrl);
        if (!id) {
            toast.error("Link-ga YouTube ma saxna! Hubi inuu yahay Shorts, Watch ama Embed URL.");
            return;
        }

        setSavingSecond(true);
        try {
            const payload: PromoVideoSettings = {
                videoUrl: secondVideoUrl.trim(),
                title: secondTitle.trim() || DEFAULT_SECONDHAND_PROMO.title,
                desc: secondDesc.trim() || DEFAULT_SECONDHAND_PROMO.desc,
                tag: secondTag.trim() || DEFAULT_SECONDHAND_PROMO.tag,
            };

            const { error } = await supabase.from("app_settings").upsert(
                [
                    { key: "secondhand_ad_video_url", value: payload.videoUrl },
                    { key: "secondhand_ad_title", value: payload.title },
                    { key: "secondhand_ad_desc", value: payload.desc },
                    { key: "secondhand_ad_tag", value: payload.tag },
                ],
                { onConflict: "key" }
            );

            if (error) {
                toast.error("Khalad keydinta: " + error.message);
            } else {
                toast.success("✅ Muuqaalka Xayeysiiska Suuqa Casriga (Second-Hand) si guul leh ayaa loo keydiyay!");
                setPreviewKey((k) => k + 1);
                saveSecondHandPromoSettings(payload);
            }
        } catch (err: any) {
            toast.error("Khalad keydinta: " + err.message);
        } finally {
            setSavingSecond(false);
        }
    };

    const handleResetCurrent = () => {
        if (activeTab === "technicians") {
            setTechVideoUrl(DEFAULT_TECHNICIAN_PROMO.videoUrl);
            setTechTitle(DEFAULT_TECHNICIAN_PROMO.title);
            setTechDesc(DEFAULT_TECHNICIAN_PROMO.desc);
            setTechTag(DEFAULT_TECHNICIAN_PROMO.tag);
            toast.info("Waxaa dib loogu soo celiyay qiimihii asalka ahaa ee Farsamo Yaqaanno");
        } else if (activeTab === "real-estate") {
            setPropVideoUrl(DEFAULT_PROPERTY_PROMO.videoUrl);
            setPropTitle(DEFAULT_PROPERTY_PROMO.title);
            setPropDesc(DEFAULT_PROPERTY_PROMO.desc);
            setPropTag(DEFAULT_PROPERTY_PROMO.tag);
            toast.info("Waxaa dib loogu soo celiyay qiimihii asalka ahaa ee Guryaha & Dhulka");
        } else {
            setSecondVideoUrl(DEFAULT_SECONDHAND_PROMO.videoUrl);
            setSecondTitle(DEFAULT_SECONDHAND_PROMO.title);
            setSecondDesc(DEFAULT_SECONDHAND_PROMO.desc);
            setSecondTag(DEFAULT_SECONDHAND_PROMO.tag);
            toast.info("Waxaa dib loogu soo celiyay qiimihii asalka ahaa ee Suuqa Casriga");
        }
        setPreviewKey((k) => k + 1);
    };

    const copySqlSnippet = () => {
        let sql = "";
        if (activeTab === "technicians") {
            sql = `INSERT INTO app_settings (key, value) VALUES
  ('technician_ad_video_url', '${techVideoUrl.replace(/'/g, "''")}'),
  ('technician_ad_title', '${techTitle.replace(/'/g, "''")}'),
  ('technician_ad_desc', '${techDesc.replace(/'/g, "''")}'),
  ('technician_ad_tag', '${techTag.replace(/'/g, "''")}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`;
        } else if (activeTab === "real-estate") {
            sql = `INSERT INTO app_settings (key, value) VALUES
  ('property_ad_video_url', '${propVideoUrl.replace(/'/g, "''")}'),
  ('property_ad_title', '${propTitle.replace(/'/g, "''")}'),
  ('property_ad_desc', '${propDesc.replace(/'/g, "''")}'),
  ('property_ad_tag', '${propTag.replace(/'/g, "''")}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`;
        } else {
            sql = `INSERT INTO app_settings (key, value) VALUES
  ('secondhand_ad_video_url', '${secondVideoUrl.replace(/'/g, "''")}'),
  ('secondhand_ad_title', '${secondTitle.replace(/'/g, "''")}'),
  ('secondhand_ad_desc', '${secondDesc.replace(/'/g, "''")}'),
  ('secondhand_ad_tag', '${secondTag.replace(/'/g, "''")}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`;
        }

        navigator.clipboard.writeText(sql);
        toast.success("SQL query-ga waa la koobiyeeyay!");
    };

    return (
        <div className="space-y-6 pb-16">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Maamulka Muuqaallada Xayeysiiska (YouTube Promo Studio)"
                    description="Ku maamul muuqaallada xayeysiiska YouTube ee ka muuqanaya qaybaha Farsamo Yaqaannada, Guryaha & Dhulka, iyo Suuqa Casriga ah ee App-ka mobaylka."
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={copySqlSnippet}
                        className="text-xs font-semibold gap-1.5"
                        title="Koobiyee SQL query-ga tooska ah"
                    >
                        <Copy className="h-3.5 w-3.5" /> Koobiyee SQL
                    </Button>

                    {activeTab === "technicians" ? (
                        <Button
                            onClick={() => handleSaveTechnician()}
                            disabled={savingTech || loading}
                            className="bg-red-600 hover:bg-red-700 text-white font-extrabold gap-2 shadow-sm"
                        >
                            {savingTech ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {savingTech ? "Keydinaya..." : "Keydi Farsamada"}
                        </Button>
                    ) : activeTab === "real-estate" ? (
                        <Button
                            onClick={() => handleSaveProperty()}
                            disabled={savingProp || loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold gap-2 shadow-sm"
                        >
                            {savingProp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {savingProp ? "Keydinaya..." : "Keydi Guryaha"}
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleSaveSecondHand()}
                            disabled={savingSecond || loading}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold gap-2 shadow-sm"
                        >
                            {savingSecond ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {savingSecond ? "Keydinaya..." : "Keydi Suuqa Casriga"}
                        </Button>
                    )}
                </div>
            </div>

            {/* 5. UI & Layout: Tabbed Interface for 3 Modules */}
            {!lockedTab && <div className="flex items-center gap-3 border-b border-slate-200 pb-3 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("technicians")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${activeTab === "technicians"
                            ? "bg-red-600 text-white shadow-md shadow-red-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                >
                    <Wrench className="h-4 w-4" />
                    <span>Tab 1: Technicians (Farsamo)</span>
                </button>

                {!hideRealEstate && <button
                    onClick={() => setActiveTab("real-estate")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${activeTab === "real-estate"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                >
                    <Home className="h-4 w-4" />
                    <span>Tab 2: Real Estate (Guryo & Dhul)</span>
                </button>}

                {!hideSecondHand && <button
                    onClick={() => setActiveTab("second-hand")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${activeTab === "second-hand"
                            ? "bg-amber-600 text-white shadow-md shadow-amber-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                >
                    <Tags className="h-4 w-4" />
                    <span>Tab 3: Second-Hand (Suuqa Casriga)</span>
                </button>}
            </div>}

            {/* Sub-navigation shortcut to sections */}
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 px-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span>
                        Hadda waxaad wax ka beddelaysaa:{" "}
                        <strong className="text-slate-800">
                            {activeTab === "technicians"
                                ? "Qaybta Farsamo Yaqaanno (Technicians)"
                                : activeTab === "real-estate"
                                    ? "Qaybta Guryaha & Dhulka (Real Estate)"
                                    : "Qaybta Suuqa Casriga ah ee Alaabta (Second-Hand)"}
                        </strong>
                    </span>
                </div>
                {!hideSectionLink && <Link
                    href={
                        lockedTab
                            ? lockedTab === "real-estate" ? "/real-estate" : "/second-hand"
                            : activeTab === "technicians"
                            ? "/admin/technicians"
                            : activeTab === "real-estate"
                                ? "/real-estate"
                                : "/second-hand"
                    }
                    className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                >
                    Eeg Bogga Tooska ah ee{" "}
                    {activeTab === "technicians"
                        ? "Farsamada"
                        : activeTab === "real-estate"
                            ? "Guryaha"
                            : "Suuqa Casriga"}{" "}
                    <ArrowRight className="h-3 w-3" />
                </Link>}
            </div>

            {/* Main Grid: Form Inputs + Live YouTube Video Preview */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column: Form Inputs (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${activeTab === "technicians"
                                                ? "bg-red-100 text-red-600"
                                                : activeTab === "real-estate"
                                                    ? "bg-emerald-100 text-emerald-600"
                                                    : "bg-amber-100 text-amber-600"
                                            }`}
                                    >
                                        <Youtube className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-extrabold text-slate-900">
                                            {activeTab === "technicians"
                                                ? "Xayeysiiska Muuqaalka Farsamada"
                                                : activeTab === "real-estate"
                                                    ? "Xayeysiiska Muuqaalka Guryaha & Dhulka"
                                                    : "Xayeysiiska Muuqaalka Suuqa Casriga (Second-Hand)"}
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500">
                                            Isku hagaaji link-ga YouTube, cinwaanka, iyo faahfaahinta app-ka
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    className={
                                        currentVideoId
                                            ? "bg-emerald-100 text-emerald-800 border-emerald-200 font-bold"
                                            : "bg-red-100 text-red-700 border-red-200 font-bold"
                                    }
                                >
                                    {currentVideoId ? `✓ ${currentUrlType}` : "Link Khalad Ah"}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-5">
                            <form
                                onSubmit={
                                    activeTab === "technicians"
                                        ? handleSaveTechnician
                                        : activeTab === "real-estate"
                                            ? handleSaveProperty
                                            : handleSaveSecondHand
                                }
                                className="space-y-4"
                            >
                                {/* Form Input: YouTube Video URL */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Video
                                                className={`h-3.5 w-3.5 ${activeTab === "technicians"
                                                        ? "text-red-600"
                                                        : activeTab === "real-estate"
                                                            ? "text-emerald-600"
                                                            : "text-amber-600"
                                                    }`}
                                            />
                                            YouTube Video URL *
                                        </Label>
                                        {currentVideoId && (
                                            <span className="text-[11px] font-mono text-slate-500">
                                                Video ID: <span className="font-bold text-slate-800">{currentVideoId}</span>
                                            </span>
                                        )}
                                    </div>
                                    <Input
                                        value={
                                            activeTab === "technicians"
                                                ? techVideoUrl
                                                : activeTab === "real-estate"
                                                    ? propVideoUrl
                                                    : secondVideoUrl
                                        }
                                        onChange={(e) => {
                                            if (activeTab === "technicians") setTechVideoUrl(e.target.value);
                                            else if (activeTab === "real-estate") setPropVideoUrl(e.target.value);
                                            else setSecondVideoUrl(e.target.value);
                                        }}
                                        placeholder="https://www.youtube.com/watch?v=fq4N0hgOWzU"
                                        className="font-mono text-xs h-11"
                                        required
                                    />
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                                        <span className="font-semibold text-slate-600">Qaababka la taageero:</span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">watch?v=...</span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">/shorts/...</span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">youtu.be/...</span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">/embed/...</span>
                                    </div>
                                </div>

                                {/* Form Input: Promo Title */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Cinwaanka Xayeysiiska (Promo Title) *
                                    </Label>
                                    <Input
                                        value={
                                            activeTab === "technicians"
                                                ? techTitle
                                                : activeTab === "real-estate"
                                                    ? propTitle
                                                    : secondTitle
                                        }
                                        onChange={(e) => {
                                            if (activeTab === "technicians") setTechTitle(e.target.value);
                                            else if (activeTab === "real-estate") setPropTitle(e.target.value);
                                            else setSecondTitle(e.target.value);
                                        }}
                                        placeholder={
                                            activeTab === "technicians"
                                                ? "Farsamo Yaqaano Xirfad Leh"
                                                : activeTab === "real-estate"
                                                    ? "Guryo & Dhul Casri Ah"
                                                    : "Suuqa Casriga Ah Ee Alaabta"
                                        }
                                        className="h-11 font-semibold text-sm"
                                        required
                                    />
                                </div>

                                {/* Form Input: Description textarea */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">
                                        Faahfaahinta Xayeysiiska (Description)
                                    </Label>
                                    <Textarea
                                        value={
                                            activeTab === "technicians"
                                                ? techDesc
                                                : activeTab === "real-estate"
                                                    ? propDesc
                                                    : secondDesc
                                        }
                                        onChange={(e) => {
                                            if (activeTab === "technicians") setTechDesc(e.target.value);
                                            else if (activeTab === "real-estate") setPropDesc(e.target.value);
                                            else setSecondDesc(e.target.value);
                                        }}
                                        placeholder={
                                            activeTab === "technicians"
                                                ? "Dooro adeegga aad u baahan tahay, si automatic ahna ugu bixi EVC Plus."
                                                : activeTab === "real-estate"
                                                    ? "Ka hel guryaha kirada iyo iibka ah ee ugu tayada sarreeya."
                                                    : "Iibso ama iibi alaab kasta oo la isticmaalay si fudud oo ammaan ah."
                                        }
                                        className="min-h-[85px] text-sm resize-none"
                                        rows={3}
                                    />
                                </div>

                                {/* Form Input: Tag / Badge input */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5 text-blue-600" /> Tag / Badge Label
                                    </Label>
                                    <Input
                                        value={
                                            activeTab === "technicians"
                                                ? techTag
                                                : activeTab === "real-estate"
                                                    ? propTag
                                                    : secondTag
                                        }
                                        onChange={(e) => {
                                            if (activeTab === "technicians") setTechTag(e.target.value);
                                            else if (activeTab === "real-estate") setPropTag(e.target.value);
                                            else setSecondTag(e.target.value);
                                        }}
                                        placeholder={
                                            activeTab === "technicians"
                                                ? "WAAFI PAY API INTEGRATED"
                                                : activeTab === "real-estate"
                                                    ? "REAL ESTATE & PROPERTIES"
                                                    : "SUUQA CASRIGA & SECOND HAND"
                                        }
                                        className="h-10 text-xs font-mono uppercase"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResetCurrent}
                                        className="text-xs font-semibold text-slate-600 gap-1.5"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" /> Dib U Celiy (Reset)
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        {currentVideoUrl && (
                                            <a
                                                href={currentVideoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline px-2.5 py-1.5 rounded-lg hover:bg-blue-50"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" /> YouTube ku fur
                                            </a>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={
                                                activeTab === "technicians"
                                                    ? savingTech
                                                    : activeTab === "real-estate"
                                                        ? savingProp
                                                        : savingSecond
                                            }
                                            className={`${activeTab === "technicians"
                                                    ? "bg-red-600 hover:bg-red-700"
                                                    : activeTab === "real-estate"
                                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                                        : "bg-amber-600 hover:bg-amber-700"
                                                } text-white font-extrabold gap-2 px-6 shadow-md`}
                                        >
                                            {activeTab === "technicians" && savingTech ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : activeTab === "real-estate" && savingProp ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : activeTab === "second-hand" && savingSecond ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4" />
                                            )}
                                            Keydi Xayeysiiska (Save)
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Database Context Details */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-sm border border-slate-700 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <h4 className="font-black text-sm text-white">Supabase app_settings Table Sync</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Xayeysiisyadan waxaa lagu maareeyaa miiska <code className="text-emerald-400 font-mono">app_settings</code> ee Supabase:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-700/60">
                                <span className="text-red-400 font-bold block">Technicians:</span>
                                <span className="text-slate-400 block">• technician_ad_video_url</span>
                                <span className="text-slate-400 block">• technician_ad_title</span>
                                <span className="text-slate-400 block">• technician_ad_desc</span>
                                <span className="text-slate-400 block">• technician_ad_tag</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-700/60">
                                <span className="text-emerald-400 font-bold block">Real Estate:</span>
                                <span className="text-slate-400 block">• property_ad_video_url</span>
                                <span className="text-slate-400 block">• property_ad_title</span>
                                <span className="text-slate-400 block">• property_ad_desc</span>
                                <span className="text-slate-400 block">• property_ad_tag</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-700/60">
                                <span className="text-amber-400 font-bold block">Second-Hand:</span>
                                <span className="text-slate-400 block">• secondhand_ad_video_url</span>
                                <span className="text-slate-400 block">• secondhand_ad_title</span>
                                <span className="text-slate-400 block">• secondhand_ad_desc</span>
                                <span className="text-slate-400 block">• secondhand_ad_tag</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Right Column: Live YouTube Video Preview (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye
                                    className={`h-4 w-4 ${activeTab === "technicians"
                                            ? "text-red-600"
                                            : activeTab === "real-estate"
                                                ? "text-emerald-600"
                                                : "text-amber-600"
                                        }`}
                                />
                                <h3 className="font-extrabold text-sm text-slate-900">
                                    Muuqaalka Tooska Ah (Live Preview)
                                </h3>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                                {activeTab === "technicians"
                                    ? "Farsamo Yaqaanno"
                                    : activeTab === "real-estate"
                                        ? "Guryaha & Dhulka"
                                        : "Suuqa Casriga"}
                            </span>
                        </div>

                        {/* Simulated Mobile Card Frame */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-4 space-y-4">
                            {/* Phone Status Bar Simulation */}
                            <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-400">
                                <span>9:41 AM</span>
                                <span className="flex items-center gap-1 font-mono">5G • 100%</span>
                            </div>

                            {/* Promotional Ad Card Container */}
                            <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 shadow-md overflow-hidden transition-all">
                                {/* Top Badge & Edit Pill */}
                                <div className="p-3.5 pb-2.5 flex items-center justify-between gap-2 border-b border-slate-100 bg-white">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${activeTab === "technicians"
                                                ? "bg-red-50 text-red-700 border-red-200"
                                                : activeTab === "real-estate"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                            }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full animate-pulse ${activeTab === "technicians"
                                                    ? "bg-red-500"
                                                    : activeTab === "real-estate"
                                                        ? "bg-emerald-500"
                                                        : "bg-amber-500"
                                                }`}
                                        />
                                        {currentTag || (activeTab === "technicians" ? "PROMO AD" : activeTab === "real-estate" ? "REAL ESTATE" : "SECOND HAND")}
                                    </span>
                                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                                        Badal / Edit ✏️
                                    </span>
                                </div>

                                {/* 16:9 Video Player Container */}
                                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                                    {currentVideoId ? (
                                        <iframe
                                            key={previewKey}
                                            src={currentEmbedUrl}
                                            title={currentTitle || "YouTube video player"}
                                            className="absolute inset-0 w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-2">
                                            <Video className="h-8 w-8 text-slate-600" />
                                            <p className="text-xs font-bold text-slate-300">
                                                Geli link YouTube ah si aad u daawato Live Preview-ga
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Ad Content Text */}
                                <div className="p-4 space-y-2 bg-white">
                                    <h4 className="font-black text-slate-900 text-sm leading-snug">
                                        {currentTitle || (activeTab === "technicians" ? "Cinwaanka Farsamada" : activeTab === "real-estate" ? "Cinwaanka Guryaha" : "Cinwaanka Suuqa Casriga")}
                                    </h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {currentDesc ||
                                            (activeTab === "technicians"
                                                ? "Faahfaahinta xayeysiiska farsamada..."
                                                : activeTab === "real-estate"
                                                    ? "Ka hel guryaha kirada iyo iibka ah ee ugu tayada sarreeya..."
                                                    : "Iibso ama iibi alaab kasta oo la isticmaalay si fudud oo ammaan ah...")}
                                    </p>

                                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[11px]">
                                        <span
                                            className={`font-extrabold flex items-center gap-1 ${activeTab === "technicians"
                                                    ? "text-emerald-600"
                                                    : activeTab === "real-estate"
                                                        ? "text-blue-600"
                                                        : "text-amber-600"
                                                }`}
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                                            {activeTab === "technicians"
                                                ? "Diyaar U Ah Shaqo"
                                                : activeTab === "real-estate"
                                                    ? "Guryo Diyaar Ah"
                                                    : "Alaab Diyaar Ah"}
                                        </span>
                                        <span className="text-slate-400 font-medium">EMARA Marketplace</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sample Presets */}
                            <div className="space-y-2 pt-1 border-t border-slate-100">
                                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                    <Play className="h-3 w-3 text-red-600" /> Tusaalooyinka Degdegga Ah (Quick Presets):
                                </span>
                                {activeTab === "technicians" ? (
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTechVideoUrl("https://www.youtube.com/watch?v=fq4N0hgOWzU");
                                                setTechTitle("Farsamo Yaqaano Xirfad Leh");
                                                setTechDesc("Dooro adeegga aad u baahan tahay, si automatic ahna ugu bixi EVC Plus.");
                                                setTechTag("WAAFI PAY API INTEGRATED");
                                            }}
                                            className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-left transition-colors"
                                        >
                                            1. Waafi Pay Tech Ad
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTechVideoUrl("https://www.youtube.com/shorts/fq4N0hgOWzU");
                                                setTechTitle("Adeegyada Korontada & AC");
                                                setTechDesc("Farsamo yaqaan khibrad leh oo degdeg kuugu imanaya.");
                                                setTechTag("PREMIUM TECHNICIANS");
                                            }}
                                            className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-left transition-colors"
                                        >
                                            2. Shorts Format Ad
                                        </button>
                                    </div>
                                ) : activeTab === "real-estate" ? (
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPropVideoUrl("https://www.youtube.com/watch?v=fq4N0hgOWzU");
                                                setPropTitle("Guryo & Dhul Casri Ah");
                                                setPropDesc("Ka hel guryaha kirada iyo iibka ah ee ugu tayada sarreeya.");
                                                setPropTag("REAL ESTATE & PROPERTIES");
                                            }}
                                            className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-left transition-colors"
                                        >
                                            1. Modern Villa Tour
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPropVideoUrl("https://www.youtube.com/shorts/fq4N0hgOWzU");
                                                setPropTitle("Dabaqyo Kirada Ah Muqdisho");
                                                setPropDesc("Dabaqyo cusub oo qalabaysan, amni buuxa iyo baarkin.");
                                                setPropTag("APARTMENTS & FLATS");
                                            }}
                                            className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-left transition-colors"
                                        >
                                            2. Apartment Shorts
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSecondVideoUrl("https://www.youtube.com/watch?v=fq4N0hgOWzU");
                                                setSecondTitle("Suuqa Casriga Ah Ee Alaabta");
                                                setSecondDesc("Iibso ama iibi alaab kasta oo la isticmaalay si fudud oo ammaan ah.");
                                                setSecondTag("SUUQA CASRIGA & SECOND HAND");
                                            }}
                                            className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-left transition-colors"
                                        >
                                            1. Alaabta La Isticmaalay
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSecondVideoUrl("https://www.youtube.com/shorts/fq4N0hgOWzU");
                                                setSecondTitle("Telefoono & Laptop-yo Second-Hand");
                                                setSecondDesc("Alaab tayo leh oo qiimo jaban, hubi ka hor inta aadan iibsan.");
                                                setSecondTag("ELECTRONICS & GADGETS");
                                            }}
                                            className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-left transition-colors"
                                        >
                                            2. Electronics Shorts
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

