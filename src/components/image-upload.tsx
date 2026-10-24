"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    bucket?: string;
}

export function ImageUpload({ value, onChange, label = "Sawirka (Image)", bucket = "products" }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [mode, setMode] = useState<"upload" | "url">("upload");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
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

            setUploading(true);

            // 1. Try Supabase Storage Upload
            const fileExt = file.name.split(".").pop() || "jpg";
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { upsert: true });

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(fileName);

                if (publicUrl) {
                    onChange(publicUrl);
                    toast.success("Sawirka waa la soo gudbiyay");
                    setUploading(false);
                    return;
                }
            }

            // 2. High Reliability Base64 Fallback if Storage Bucket is not set up
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                if (base64Url) {
                    onChange(base64Url);
                    toast.success("Sawirka waa ka soo xarooday Device-ka");
                }
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error: any) {
            // Read via FileReader
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                if (base64Url) {
                    onChange(base64Url);
                    toast.success("Sawirka waa ka soo xarooday Device-ka");
                }
                setUploading(false);
            };
            reader.readAsDataURL(e.target.files![0]);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5 text-rose-400" /> {label}
                </span>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                        type="button"
                        onClick={() => setMode("upload")}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all ${mode === "upload" ? "bg-rose-600 text-white" : "text-slate-400"
                            }`}
                    >
                        📁 Device Upload
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("url")}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all ${mode === "url" ? "bg-rose-600 text-white" : "text-slate-400"
                            }`}
                    >
                        🔗 Image Link
                    </button>
                </div>
            </div>

            {value ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center group">
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <button
                        onClick={() => onChange("")}
                        className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-700 transition-colors"
                        type="button"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : mode === "upload" ? (
                <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`
            relative w-full border-2 border-dashed border-slate-800 bg-slate-950/60 rounded-2xl p-6
            flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-900/80 hover:border-rose-500/50
            ${uploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                            <p className="text-xs font-bold text-slate-300">Soo shubayaa sawirka...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-2 text-slate-400">
                            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full">
                                <Upload className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-slate-200">Riix si aad u soo doorato sawirka Device-ka</p>
                                <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, WebP (Max 8MB)</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="pl-9 bg-slate-950 border-slate-800 text-white rounded-xl text-xs h-10"
                    />
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}
