"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, X, Images, Video, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiImageUpload } from "@/components/multi-image-upload";
import { MediaPreviewModal } from "@/components/media-preview-modal";
import type { SecondHandItem } from "@/lib/types";

export default function SecondHandPage() {
    const [items, setItems] = useState<SecondHandItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SecondHandItem | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("electronics");
    const [condition, setCondition] = useState("used-good");
    const [price, setPrice] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [location, setLocation] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState("");

    useEffect(() => {
        fetchItems();
    }, []);

    async function fetchItems() {
        setLoading(true);
        const { data, error } = await supabase
            .from("second_hand_items")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (!error && data) {
            setItems(data as SecondHandItem[]);
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this item?")) {
            await supabase.from("second_hand_items").delete().eq("id", id);
            fetchItems();
        }
    }

    async function handleAddItem(e: React.FormEvent) {
        e.preventDefault();

        const { error } = await supabase.from("second_hand_items").insert([{
            title,
            description,
            category,
            condition,
            price: parseFloat(price),
            currency,
            location,
            images,
            video_url: videoUrl || null,
            status: "approved",
            seller_name: "Admin Store",
        }]);

        if (!error) {
            setShowAddForm(false);
            setTitle(""); setDescription(""); setPrice(""); setLocation("");
            setImages([]); setVideoUrl("");
            fetchItems();
        } else {
            alert("Failed to add Item: " + error.message);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader title="Second-Hand Marketplace" description="Manage items and add new items directly." />
                <Button onClick={() => setShowAddForm(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Item
                </Button>
            </div>

            {showAddForm && (
                <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-6 relative">
                        <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X className="h-5 w-5" />
                        </button>
                        <h3 className="text-lg font-semibold mb-4">Add Second-Hand Item</h3>
                        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 px-3 py-2 text-sm border rounded-md" required>
                                    <option value="electronics">Electronics</option>
                                    <option value="furniture">Furniture</option>
                                    <option value="clothing">Clothing</option>
                                    <option value="vehicles">Vehicles</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Condition</Label>
                                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full h-10 px-3 py-2 text-sm border rounded-md" required>
                                    <option value="like-new">Like New</option>
                                    <option value="used-good">Used - Good</option>
                                    <option value="used-fair">Used - Fair</option>
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
                                <Button type="submit" className="w-full md:w-auto">Save Item</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading items...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {items.map((item) => {
                        const allImages = item.images?.length ? item.images : [];
                        const coverImage = allImages[0];

                        return (
                            <Card key={item.id} className="overflow-hidden bg-white/50 backdrop-blur-sm border-slate-100 shadow-sm transition-all hover:shadow-md">
                                {coverImage && (
                                    <div
                                        onClick={() => setSelectedItem(item)}
                                        className="relative w-full h-40 bg-slate-100 cursor-pointer group overflow-hidden"
                                    >
                                        <img
                                            src={coverImage}
                                            alt={item.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                                            View Gallery
                                        </div>
                                        {allImages.length > 1 && (
                                            <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                                                <Images className="w-3 h-3" /> {allImages.length} photos
                                            </span>
                                        )}
                                        {item.video_url && (
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
                                                <h4 className="font-semibold text-slate-800 line-clamp-1">{item.title}</h4>
                                                {item.video_url && (
                                                    <button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="text-purple-600 hover:text-purple-700"
                                                        title="Watch video"
                                                    >
                                                        <Video className="w-4 h-4 shrink-0" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">{item.location}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 -mt-2 -mr-2">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600 capitalize">{item.category}</span>
                                        <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600 capitalize">{item.condition}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-900 border px-2 py-1 rounded bg-slate-50">
                                            {item.currency} {item.price?.toLocaleString()}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded-full capitalize
                                            ${item.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {items.length === 0 && !loading && (
                        <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                            No items found. Add one to get started.
                        </div>
                    )}
                </div>
            )}

            {selectedItem && (
                <MediaPreviewModal
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    images={selectedItem.images ?? []}
                    videoUrl={selectedItem.video_url}
                    title={selectedItem.title}
                />
            )}
        </div>
    );
}
