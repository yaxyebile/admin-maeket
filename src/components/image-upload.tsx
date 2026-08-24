"use client";

import { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    bucket?: string;
}

export function ImageUpload({ value, onChange, bucket = "products" }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith("image/")) {
                toast.error("Fadlan gudbi sawir oo kaliya");
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Sawirku waa inuu ka yaraadaa 5MB");
                return;
            }

            setUploading(true);

            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = fileName;

            const { error: uploadError, data } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(publicUrl);
            toast.success("Sawirka waa la soo gudbiyay");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Khalad ayaa dhacay markii sawirka la soo gudbinayay: " + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = () => {
        onChange("");
    };

    return (
        <div className="space-y-4 w-full flex flex-col items-center justify-center">
            <div
                onClick={() => !value && !uploading && fileInputRef.current?.click()}
                className={`
          relative w-full aspect-square max-w-[300px] rounded-xl border-2 border-dashed 
          flex flex-col items-center justify-center cursor-pointer transition-all
          ${value ? 'border-transparent' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                {value ? (
                    <>
                        <Image
                            src={value}
                            alt="Upload"
                            fill
                            className="object-cover rounded-xl"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeImage();
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                            type="button"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
                        {uploading ? (
                            <>
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <p className="text-sm font-medium">Soo gudbinayaa...</p>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-slate-100 rounded-full">
                                    <Upload className="w-8 h-8 text-slate-400" />
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-sm font-medium">Riix si aad u soo geliso sawir</p>
                                    <p className="text-xs text-slate-400 mt-1">JPG, PNG ama WebP (Max 5MB)</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

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
