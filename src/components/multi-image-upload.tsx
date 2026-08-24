"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2, Images } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
            toast.error("Please upload images only");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB");
            return;
        }

        const slotIndex = activeSlotRef.current;
        setUploadingIndex(slotIndex);

        try {
            const ext = file.name.split(".").pop();
            const fileName = `${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from(bucket).getPublicUrl(fileName);

            const next = [...values];
            next[slotIndex] = publicUrl;
            onChange(next.filter(Boolean));
            toast.success("Image uploaded");
        } catch (err: any) {
            toast.error("Upload failed: " + err.message);
        } finally {
            setUploadingIndex(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = (index: number) => {
        const next = [...values];
        next.splice(index, 1);
        onChange(next);
    };

    // Build a fixed 4-slot array: filled slots then empty slots
    const slots = Array.from({ length: MAX_IMAGES }, (_, i) => values[i] ?? null);

    const filledCount = values.length;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
                <Images className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                    Photos ({filledCount}/{MAX_IMAGES})
                </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {slots.map((url, i) => {
                    const isUploading = uploadingIndex === i;
                    const isEmpty = !url;
                    const isNextEmpty = isEmpty && i === filledCount; // only allow adding to the next empty slot in order, or any empty slot

                    return (
                        <div
                            key={i}
                            onClick={() => isEmpty && handleSlotClick(i)}
                            className={`
                relative aspect-square rounded-lg border-2 overflow-hidden transition-all
                ${isEmpty
                                    ? "border-dashed border-slate-300 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50"
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
                                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    {i === 0 && (
                                        <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">
                                            Cover
                                        </span>
                                    )}
                                </>
                            ) : isUploading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-400">
                                    <Upload className="w-4 h-4" />
                                    <span className="text-[10px]">{i + 1}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-slate-400">
                Slot 1 is the cover image. Click an empty slot to upload. Max 5 MB each.
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
