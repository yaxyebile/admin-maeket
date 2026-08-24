"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Play, Images } from "lucide-react";
import { Button } from "@/components/ui/button";

function getYoutubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
}

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    images?: string[];
    videoUrl?: string | null;
    title?: string;
}

export function MediaPreviewModal({
    isOpen,
    onClose,
    images = [],
    videoUrl,
    title = "Media Preview",
}: MediaModalProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<"photos" | "video">(
        images.length > 0 ? "photos" : "video"
    );

    if (!isOpen) return null;

    const embedUrl = videoUrl ? getYoutubeEmbedUrl(videoUrl) : null;

    const nextImage = () => {
        setActiveIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-sm md:text-base text-slate-100 line-clamp-1">{title}</h3>
                        {/* Tabs if both images & video exist */}
                        {images.length > 0 && videoUrl && (
                            <div className="flex gap-1 bg-slate-800 p-0.5 rounded-lg text-xs">
                                <button
                                    onClick={() => setActiveTab("photos")}
                                    className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${activeTab === "photos"
                                            ? "bg-blue-600 text-white font-medium"
                                            : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    <Images className="w-3.5 h-3.5" /> Photos ({images.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("video")}
                                    className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${activeTab === "video"
                                            ? "bg-purple-600 text-white font-medium"
                                            : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" /> Video
                                </button>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content Area */}
                <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[420px]">
                    {activeTab === "photos" && images.length > 0 ? (
                        <div className="relative w-full h-full flex items-center justify-center group">
                            <img
                                src={images[activeIndex]}
                                alt={`${title} ${activeIndex + 1}`}
                                className="max-h-[70vh] w-auto max-w-full object-contain select-none"
                            />
                            {/* Counter badge */}
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-xs px-2.5 py-1 rounded-full text-slate-200">
                                {activeIndex + 1} / {images.length}
                            </div>
                            {/* Navigation controls if multiple photos */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-3 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all backdrop-blur-sm"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-3 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all backdrop-blur-sm"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                    {/* Thumbnails strip */}
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-1.5 rounded-xl backdrop-blur-sm">
                                        {images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveIndex(idx)}
                                                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${activeIndex === idx
                                                        ? "border-blue-500 scale-105"
                                                        : "border-transparent opacity-60 hover:opacity-100"
                                                    }`}
                                            >
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : activeTab === "video" && videoUrl ? (
                        <div className="w-full h-full aspect-video max-h-[70vh] flex items-center justify-center bg-black">
                            {embedUrl ? (
                                <iframe
                                    src={embedUrl}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title="Product Video"
                                />
                            ) : videoUrl.endsWith(".mp4") || videoUrl.includes("supabase.co") ? (
                                <video
                                    src={videoUrl}
                                    controls
                                    autoPlay
                                    className="max-h-[70vh] w-full"
                                />
                            ) : (
                                <div className="text-center p-6 space-y-3">
                                    <p className="text-slate-400 text-sm">External video link</p>
                                    <a
                                        href={videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <Play className="w-4 h-4 fill-current" /> Open Video Link
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-slate-500 text-sm">No media available</div>
                    )}
                </div>
            </div>
        </div>
    );
}
