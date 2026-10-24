import { supabase } from "@/lib/supabase";

export interface PromoVideoSettings {
    videoUrl: string;
    title: string;
    desc: string;
    tag: string;
}

export const DEFAULT_TECHNICIAN_PROMO: PromoVideoSettings = {
    videoUrl: "https://www.youtube.com/watch?v=fq4N0hgOWzU",
    title: "Farsamo Yaqaano Xirfad Leh",
    desc: "Dooro adeegga aad u baahan tahay, si automatic ahna ugu bixi EVC Plus.",
    tag: "WAAFI PAY API INTEGRATED",
};

export const DEFAULT_PROPERTY_PROMO: PromoVideoSettings = {
    videoUrl: "https://www.youtube.com/watch?v=fq4N0hgOWzU",
    title: "Guryo & Dhul Casri Ah",
    desc: "Ka hel guryaha kirada iyo iibka ah ee ugu tayada sarreeya.",
    tag: "REAL ESTATE & PROPERTIES",
};

export const DEFAULT_SECONDHAND_PROMO: PromoVideoSettings = {
    videoUrl: "https://www.youtube.com/watch?v=fq4N0hgOWzU",
    title: "Suuqa Casriga Ah Ee Alaabta",
    desc: "Iibso ama iibi alaab kasta oo la isticmaalay si fudud oo ammaan ah.",
    tag: "SUUQA CASRIGA & SECOND HAND",
};

const STORAGE_TECH_KEY = "emara_technician_promo_settings";
const STORAGE_PROPERTY_KEY = "emara_property_promo_settings";
const STORAGE_SECONDHAND_KEY = "emara_secondhand_promo_settings";

/**
 * Extracts YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=fq4N0hgOWzU
 * - https://youtu.be/fq4N0hgOWzU
 * - https://www.youtube.com/shorts/fq4N0hgOWzU
 * - https://www.youtube.com/embed/fq4N0hgOWzU
 * - URLs with additional query parameters or timestamps
 */
export function getYouTubeVideoId(url: string): string | null {
    if (!url || typeof url !== "string") return null;
    const cleanUrl = url.trim();

    // Pattern matching watch, shorts, embed, youtu.be
    const regExp = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = cleanUrl.match(regExp);
    if (match && match[1]) {
        return match[1];
    }

    // Fallback for direct 11-char ID input
    if (/^[\w-]{11}$/.test(cleanUrl)) {
        return cleanUrl;
    }

    return null;
}

/**
 * Detect URL type for administrative feedback
 */
export function detectYouTubeUrlType(url: string): "Shorts" | "Watch URL" | "Embed" | "Short Link" | "Invalid" {
    if (!url) return "Invalid";
    const id = getYouTubeVideoId(url);
    if (!id) return "Invalid";

    if (url.includes("/shorts/")) return "Shorts";
    if (url.includes("youtu.be/")) return "Short Link";
    if (url.includes("/embed/")) return "Embed";
    return "Watch URL";
}

/**
 * Generates responsive embed URL for iframe
 */
export function getYouTubeEmbedUrl(url: string, autoPlay: boolean = false): string {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return "";
    const params = new URLSearchParams({
        rel: "0",
        modestbranding: "1",
        playsinline: "1",
        enablejsapi: "1",
    });
    if (autoPlay) {
        params.set("autoplay", "1");
        params.set("mute", "1");
    }
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * High-quality thumbnail image URL
 */
export function getYouTubeThumbnailUrl(url: string): string {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return "";
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Query app_settings for Technician, Real Estate, and Second-Hand promo video keys
 */
export async function getAllPromoVideoSettings(): Promise<{
    technician: PromoVideoSettings;
    property: PromoVideoSettings;
    secondhand: PromoVideoSettings;
}> {
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

            const technician: PromoVideoSettings = {
                videoUrl: map["technician_ad_video_url"]?.trim() || DEFAULT_TECHNICIAN_PROMO.videoUrl,
                title: map["technician_ad_title"]?.trim() || DEFAULT_TECHNICIAN_PROMO.title,
                desc: map["technician_ad_desc"]?.trim() || DEFAULT_TECHNICIAN_PROMO.desc,
                tag: map["technician_ad_tag"]?.trim() || DEFAULT_TECHNICIAN_PROMO.tag,
            };

            const property: PromoVideoSettings = {
                videoUrl: map["property_ad_video_url"]?.trim() || DEFAULT_PROPERTY_PROMO.videoUrl,
                title: map["property_ad_title"]?.trim() || DEFAULT_PROPERTY_PROMO.title,
                desc: map["property_ad_desc"]?.trim() || DEFAULT_PROPERTY_PROMO.desc,
                tag: map["property_ad_tag"]?.trim() || DEFAULT_PROPERTY_PROMO.tag,
            };

            const secondhand: PromoVideoSettings = {
                videoUrl: map["secondhand_ad_video_url"]?.trim() || DEFAULT_SECONDHAND_PROMO.videoUrl,
                title: map["secondhand_ad_title"]?.trim() || DEFAULT_SECONDHAND_PROMO.title,
                desc: map["secondhand_ad_desc"]?.trim() || DEFAULT_SECONDHAND_PROMO.desc,
                tag: map["secondhand_ad_tag"]?.trim() || DEFAULT_SECONDHAND_PROMO.tag,
            };

            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_TECH_KEY, JSON.stringify(technician));
                localStorage.setItem(STORAGE_PROPERTY_KEY, JSON.stringify(property));
                localStorage.setItem(STORAGE_SECONDHAND_KEY, JSON.stringify(secondhand));
            }

            return { technician, property, secondhand };
        }
    } catch (err) {
        console.warn("Could not fetch promo video settings from Supabase:", err);
    }

    // Fallbacks
    let technician = DEFAULT_TECHNICIAN_PROMO;
    let property = DEFAULT_PROPERTY_PROMO;
    let secondhand = DEFAULT_SECONDHAND_PROMO;

    if (typeof window !== "undefined") {
        try {
            const cachedTech = localStorage.getItem(STORAGE_TECH_KEY);
            if (cachedTech) technician = JSON.parse(cachedTech);
            const cachedProp = localStorage.getItem(STORAGE_PROPERTY_KEY);
            if (cachedProp) property = JSON.parse(cachedProp);
            const cachedSecond = localStorage.getItem(STORAGE_SECONDHAND_KEY);
            if (cachedSecond) secondhand = JSON.parse(cachedSecond);
        } catch { }
    }

    return { technician, property, secondhand };
}

/**
 * Fetch Technician promo settings
 */
export async function getTechnicianPromoSettings(): Promise<PromoVideoSettings> {
    const all = await getAllPromoVideoSettings();
    return all.technician;
}

/**
 * Fetch Property promo settings
 */
export async function getPropertyPromoSettings(): Promise<PromoVideoSettings> {
    const all = await getAllPromoVideoSettings();
    return all.property;
}

/**
 * Fetch Second-Hand promo settings
 */
export async function getSecondHandPromoSettings(): Promise<PromoVideoSettings> {
    const all = await getAllPromoVideoSettings();
    return all.secondhand;
}

/**
 * Save Technician promo settings to Supabase app_settings
 */
export async function saveTechnicianPromoSettings(
    settings: PromoVideoSettings
): Promise<{ success: boolean; error?: string }> {
    const entries = [
        { key: "technician_ad_video_url", value: settings.videoUrl },
        { key: "technician_ad_title", value: settings.title },
        { key: "technician_ad_desc", value: settings.desc },
        { key: "technician_ad_tag", value: settings.tag },
    ];

    if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_TECH_KEY, JSON.stringify(settings));
    }

    try {
        const { error } = await supabase
            .from("app_settings")
            .upsert(entries, { onConflict: "key" });

        if (error) {
            console.warn("Supabase upsert warning for app_settings:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        console.error("Error saving technician promo settings:", err);
        return { success: false, error: err?.message };
    }
}

/**
 * Save Real Estate Property promo settings to Supabase app_settings
 */
export async function savePropertyPromoSettings(
    settings: PromoVideoSettings
): Promise<{ success: boolean; error?: string }> {
    const entries = [
        { key: "property_ad_video_url", value: settings.videoUrl },
        { key: "property_ad_title", value: settings.title },
        { key: "property_ad_desc", value: settings.desc },
        { key: "property_ad_tag", value: settings.tag },
    ];

    if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_PROPERTY_KEY, JSON.stringify(settings));
    }

    try {
        const { error } = await supabase
            .from("app_settings")
            .upsert(entries, { onConflict: "key" });

        if (error) {
            console.warn("Supabase upsert warning for app_settings:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        console.error("Error saving property promo settings:", err);
        return { success: false, error: err?.message };
    }
}

/**
 * Save Second-Hand promo settings to Supabase app_settings
 */
export async function saveSecondHandPromoSettings(
    settings: PromoVideoSettings
): Promise<{ success: boolean; error?: string }> {
    const entries = [
        { key: "secondhand_ad_video_url", value: settings.videoUrl },
        { key: "secondhand_ad_title", value: settings.title },
        { key: "secondhand_ad_desc", value: settings.desc },
        { key: "secondhand_ad_tag", value: settings.tag },
    ];

    if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_SECONDHAND_KEY, JSON.stringify(settings));
    }

    try {
        const { error } = await supabase
            .from("app_settings")
            .upsert(entries, { onConflict: "key" });

        if (error) {
            console.warn("Supabase upsert warning for app_settings:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        console.error("Error saving secondhand promo settings:", err);
        return { success: false, error: err?.message };
    }
}
