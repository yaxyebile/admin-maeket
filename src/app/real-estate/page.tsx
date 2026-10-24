"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateId } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, X, Images, Video, Play, Youtube, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MultiImageUpload } from "@/components/multi-image-upload";
import { MediaPreviewModal } from "@/components/media-preview-modal";
import type { PropertyListing } from "@/lib/types";
import { toast } from "sonner";
import {
    getPropertyPromoSettings,
    getYouTubeEmbedUrl,
    getYouTubeVideoId,
    DEFAULT_PROPERTY_PROMO,
    type PromoVideoSettings,
} from "@/lib/promo-videos";

export default function RealEstatePage() {
    const { user } = useAuth();
    const [properties, setProperties] = useState<PropertyListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);

    // Promo Video States
    const [promo, setPromo] = useState<PromoVideoSettings>(DEFAULT_PROPERTY_PROMO);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [propertyType, setPropertyType] = useState("house");
    const [listingType, setListingType] = useState("sale");
    const [price, setPrice] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [location, setLocation] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState("");

    useEffect(() => {
        if (!user?.id) return;
        fetchProperties(user.id);
        loadPromo();
    }, [user?.id]);

    async function loadPromo() {
        try {
            const data = await getPropertyPromoSettings();
            setPromo(data);
        } catch (e) { }
    }

    async function fetchProperties(ownerId: string) {
        setLoading(true);
        const { data, error } = await supabase
            .from("property_listings")
            .select("*")
            .eq("owner_id", ownerId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (!error && data) {
            setProperties(data as PropertyListing[]);
        } else {
            setProperties([]);
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!user?.id) return;
        if (confirm("Are you sure you want to delete this property?")) {
            await supabase.from("property_listings").delete().eq("id", id).eq("owner_id", user.id);
            fetchProperties(user.id);
        }
    }

    async function handleAddProperty(e: React.FormEvent) {
        e.preventDefault();
        if (!user?.id) {
            toast.error("Fadlan mar kale gal akoonka Real Estate-ka.");
            return;
        }

        const { error } = await supabase.from("property_listings").insert([{
            id: generateId(),
            owner_id: user.id,
            title,
            description,
            property_type: propertyType,
            listing_type: listingType,
            price: parseFloat(price),
            currency,
            location,
            images,
            video_url: videoUrl || null,
            is_approved: true,
            is_available: true,
        }]);

        if (!error) {
            setShowAddForm(false);
            setTitle(""); setDescription(""); setPrice(""); setLocation("");
            setImages([]); setVideoUrl("");
            fetchProperties(user.id);
        } else {
            alert("Failed to add property: " + error.message);
        }
    }

    const promoVideoId = getYouTubeVideoId(promo.videoUrl);
    const promoEmbedUrl = getYouTubeEmbedUrl(promo.videoUrl);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader title="Real Estate Listings" description="Manage property listings and upload new properties directly." />
                <Button onClick={() => setShowAddForm(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Property
                </Button>
            </div>

            {/* Navigation Quick Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-sm font-bold overflow-x-auto">
                <a
                    href="/real-estate"
                    className="px-4 py-2 rounded-xl bg-primary text-white shadow-sm flex items-center gap-2 whitespace-nowrap"
                >
                    🏡 Guryaha & Dhulka ({properties.length})
                </a>
                <a
                    href="/real-estate/bookings"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                    📅 Dalabyada (Bookings)
                </a>
            </div>

            {/* FEATURED: PROMOTIONAL YOUTUBE VIDEO AD CARD FOR REAL ESTATE */}
            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 p-4 sm:p-5 shadow-sm space-y-4">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
                            <Youtube className="h-5 w-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase text-emerald-900 tracking-wider">
                                    Muuqaalka Xayeysiiska Guryaha & Dhulka (YouTube Promo Ad)
                                </span>
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse mr-1 inline-block" />
                                    {promo.tag || "REAL ESTATE & PROPERTIES"}
                                </Badge>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                                Toos looga aqrinayaa Supabase app_settings • Ka muuqda qaybta Guryaha & Dhulka
                            </span>
                        </div>
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

                    {/* Text Details */}
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

            {showAddForm && (
                <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-6 relative">
                        <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X className="h-5 w-5" />
                        </button>
                        <h3 className="text-lg font-semibold mb-4">Add New Property</h3>
                        <form onSubmit={handleAddProperty} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Property Type</Label>
                                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full h-10 px-3 py-2 text-sm border rounded-md" required>
                                    <option value="house">House</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="land">Land</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Listing Type</Label>
                                <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="w-full h-10 px-3 py-2 text-sm border rounded-md" required>
                                    <option value="sale">For Sale</option>
                                    <option value="rent">For Rent</option>
                                </select>
                            </div>
                            <div className="space-y-2 flex gap-2">
                                <div className="flex-1">
                                    <Label>Price</Label>
                                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                                </div>
                                <div className="w-24">
                                    <Label>Currency</Label>
                                    <Input value={currency} onChange={(e) => setCurrency(e.target.value)} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Video className="w-4 h-4 text-slate-400" />
                                    Video URL <span className="text-xs font-normal text-slate-400 ml-1">(optional)</span>
                                </Label>
                                <Input
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://youtube.com/... or .mp4 URL"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required />
                            </div>
                            <div className="md:col-span-2">
                                <MultiImageUpload
                                    values={images}
                                    onChange={setImages}
                                    bucket="images"
                                />
                            </div>
                            <div className="md:col-span-2 pt-2">
                                <Button type="submit" className="w-full md:w-auto">Save Property</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading properties...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {properties.map((property) => {
                        const allImages = property.images?.length ? property.images : [];
                        const coverImage = allImages[0];

                        return (
                            <Card key={property.id} className="overflow-hidden bg-white/50 backdrop-blur-sm border-slate-100 shadow-sm transition-all hover:shadow-md">
                                {coverImage && (
                                    <div
                                        onClick={() => setSelectedProperty(property)}
                                        className="relative w-full h-48 bg-slate-100 cursor-pointer group overflow-hidden"
                                    >
                                        <img
                                            src={coverImage}
                                            alt={property.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                                            View Details & Media
                                        </div>
                                        {allImages.length > 1 && (
                                            <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                                                <Images className="w-3 h-3" /> {allImages.length} photos
                                            </span>
                                        )}
                                        {property.video_url && (
                                            <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] bg-purple-600/90 text-white px-2 py-0.5 rounded-full font-medium shadow-sm">
                                                <Play className="w-2.5 h-2.5 fill-current" /> Video
                                            </span>
                                        )}
                                    </div>
                                )}
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="font-semibold text-slate-800 line-clamp-1">{property.title}</h4>
                                                {property.video_url && (
                                                    <button
                                                        onClick={() => setSelectedProperty(property)}
                                                        className="text-purple-600 hover:text-purple-700"
                                                        title="Watch video"
                                                    >
                                                        <Video className="w-4 h-4 shrink-0" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">{property.location}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(property.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 -mt-2 -mr-2">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600 capitalize">{property.property_type}</span>
                                        <span className="px-2 py-1 text-xs rounded-full bg-purple-50 text-purple-600 capitalize">For {property.listing_type}</span>
                                        {!property.is_approved && (
                                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-50 text-yellow-600">Pending Approval</span>
                                        )}
                                    </div>
                                    <div className="font-semibold text-slate-900">
                                        {property.currency} {property.price?.toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {properties.length === 0 && !loading && (
                        <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                            No properties found. Add one to get started.
                        </div>
                    )}
                </div>
            )}

            {selectedProperty && (
                <MediaPreviewModal
                    isOpen={!!selectedProperty}
                    onClose={() => setSelectedProperty(null)}
                    images={selectedProperty.images ?? []}
                    videoUrl={selectedProperty.video_url}
                    title={selectedProperty.title}
                />
            )}
        </div>
    );
}
