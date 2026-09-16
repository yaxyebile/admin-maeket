"use client";

import { useState, useRef } from "react";
import { Upload, Link as LinkIcon, X, Loader2, Image as ImageIcon, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DualImageInputProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    placeholder?: string;
    bucket?: string;
    className?: string;
}

export function DualImageInput({
    value,
    onChange,
    label = "Image (Sawirka)",
    placeholder = "https://example.com/image.jpg",
    bucket = "products",
    className = "",
}: DualImageInputProps) {
    const [uploading, setUploading] = useState(false);
    const [mode, setMode] = useState<"upload" | "url">("upload");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Device Upload with Supabase Storage + FileReader base64 Fallback
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Fadlan dooro sawir keliya (JPG, PNG, WebP)");
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            toast.error("Sawirku waa inuu ka yaraadaa 8MB");
            return;
        }

        setUploading(true);

        try {
            // 1. Try Supabase Storage Upload
            const fileExt = file.name.split(".").pop() || "jpg";
            const fileName = `upload-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { cacheControl: "3600", upsert: true });

            if (!uploadError) {
                const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
                if (data?.publicUrl) {
                    onChange(data.publicUrl);
                    toast.success("✅ Sawirka waa lagu soo shubay Storage-ka");
                    setUploading(false);
                    return;
                }
            }

            // 2. High Reliability Fallback: Convert to Base64 Data URL if storage bucket fails/missing
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                if (base64Url) {
                    onChange(base64Url);
                    toast.success("✅ Sawirka waa ka soo xarooday Device-ka");
                }
                setUploading(false);
            };
            reader.onerror = () => {
                toast.error("Cillad ayaa dhacday marka sawirka la akhrinayay");
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            // Read via FileReader on unexpected error
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                if (base64Url) {
                    onChange(base64Url);
                    toast.success("✅ Sawirka waa ka soo xarooday Device-ka");
                }
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className={`space-y-2.5 ${className}`}>
            <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-rose-400" />
                    {label}
                </Label>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                        type="button"
                        onClick={() => setMode("upload")}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all ${mode === "upload"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                            }`}
                    >
                        📁 Device Upload
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("url")}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all ${mode === "url"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                            }`}
                    >
                        🔗 Image Link
                    </button>
                </div>
            </div>

            {/* Preview Box if Image Selected */}
            {value ? (
                <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-48 flex items-center justify-center">
                    <img
                        src={value}
                        alt="Preview"
                        className="max-h-48 w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => onChange("")}
                            className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold h-8 px-3"
                        >
                            <X className="h-3.5 w-3.5 mr-1" /> Remove Image
                        </Button>
                    </div>
                </div>
            ) : mode === "upload" ? (
                /* Device File Picker Drop Area */
                <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-slate-800 bg-slate-950/60 hover:bg-slate-900/80 hover:border-rose-500/50 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[110px] ${uploading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                            <span className="text-xs font-bold text-slate-300">Soo galinayaa sawirka...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-400">
                            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                                <Upload className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-bold text-slate-200">
                                Riix si aad sawir uga soo doorato Device-ka (Computer/Phone)
                            </p>
                            <p className="text-[10px] text-slate-500">
                                Supports PNG, JPG, WebP (Max 8MB)
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                /* Direct URL Input */
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                        type="url"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="pl-9 bg-slate-950 border-slate-800 text-white rounded-xl text-xs h-10"
                    />
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />
        </div>
    );
}
