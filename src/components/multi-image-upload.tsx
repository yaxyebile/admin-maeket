"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Images, Link as LinkIcon, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MAX_IMAGES = 4;

interface MultiImageUploadProps {
    values: string[];
    onChange: (urls: string[]) => void;
    bucket?: string;
}

export function MultiImageUpload({
    values,
    onChange,
    bucket = "images",
}: MultiImageUploadProps) {
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [urlInputOpen, setUrlInputOpen] = useState(false);
    const [pastedUrl, setPastedUrl] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeSlotRef = useRef<number>(0);

    const handleSlotClick = (index: number) => {
        if (uploadingIndex !== null) return;
        activeSlotRef.current = index;
        fileInputRef.current?.click();
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Fadlan gudbi sawir oo kaliya");
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            toast.error("Sawirku waa inuu ka yaraadaa 8MB");
            return;
        }

        const slotIndex = activeSlotRef.current;
        setUploadingIndex(slotIndex);

        try {
            const ext = file.name.split(".").pop() || "jpg";
            const fileName = `${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { upsert: true });

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
                if (publicUrl) {
                    const next = [...values];
                    next[slotIndex] = publicUrl;
                    onChange(next.filter(Boolean));
                    toast.success("Sawirka waa la soo shubay");
                    setUploadingIndex(null);
                    return;
                }
            }

            // High Reliability Base64 FileReader Fallback
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                if (base64Url) {
                    const next = [...values];
                    next[slotIndex] = base64Url;
                    onChange(next.filter(Boolean));
                    toast.success("Sawirka waa ka soo xarooday Device-ka");
                }
                setUploadingIndex(null);
            };
            reader.readAsDataURL(file);
        } catch {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                if (base64Url) {
                    const next = [...values];
                    next[slotIndex] = base64Url;
                    onChange(next.filter(Boolean));
                    toast.success("Sawirka waa ka soo xarooday Device-ka");
                }
                setUploadingIndex(null);
            };
            reader.readAsDataURL(file);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleAddPastedUrl = () => {
        if (!pastedUrl.trim()) return;
        if (values.length >= MAX_IMAGES) {
            toast.error(`Waxaad soo gelin kartaa ugu badnaan ${MAX_IMAGES} sawir`);
            return;
        }
        onChange([...values, pastedUrl.trim()]);
        setPastedUrl("");
        setUrlInputOpen(false);
        toast.success("URL Link waa lagu daray");
    };

    const removeImage = (index: number) => {
        const next = [...values];
        next.splice(index, 1);
        onChange(next);
    };

    const slots = Array.from({ length: MAX_IMAGES }, (_, i) => values[i] ?? null);
    const filledCount = values.length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Images className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                        Photos ({filledCount}/{MAX_IMAGES})
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => setUrlInputOpen(!urlInputOpen)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                    <LinkIcon className="h-3 w-3" />
                    {urlInputOpen ? "Cancel Link" : "+ Paste Image Link"}
                </button>
            </div>

            {urlInputOpen && (
                <div className="flex gap-2">
                    <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={pastedUrl}
                        onChange={(e) => setPastedUrl(e.target.value)}
                        className="text-xs h-9"
                    />
                    <Button
                        type="button"
                        onClick={handleAddPastedUrl}
                        size="sm"
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-3"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-4 gap-2">
                {slots.map((url, i) => {
                    const isUploading = uploadingIndex === i;
                    const isEmpty = !url;

                    return (
                        <div
                            key={i}
                            onClick={() => isEmpty && handleSlotClick(i)}
                            className={`
                relative aspect-square rounded-xl border-2 overflow-hidden transition-all
                ${isEmpty
                                    ? "border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 hover:bg-rose-50"
                                    : "border-slate-200 bg-slate-100"
                                }
                ${isUploading ? "opacity-60" : ""}
              `}
                        >
                            {url ? (
                                <>
                                    <img
                                        src={url}
                                        alt={`Image ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    {i === 0 && (
                                        <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded">
                                            Cover
                                        </span>
                                    )}
                                </>
                            ) : isUploading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-400">
                                    <Upload className="w-4 h-4 text-slate-500" />
                                    <span className="text-[10px] font-bold">Slot {i + 1}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="text-[11px] text-slate-400">
                📁 Riix slot-ka si aad sawir kaga soo doorato Device-ka (Computer/Phone) ama paste link.
            </p>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
            />
        </div>
    );
}
