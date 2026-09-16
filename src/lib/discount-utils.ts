import type { Product } from "@/lib/types";

/**
 * Checks whether a product has an active, valid discount that hasn't expired.
 */
export function isDiscountActive(product: Product): boolean {
    const origPrice = Number(product.original_price || 0);
    const currentPrice = Number(product.price);

    if (origPrice <= currentPrice) return false;

    if (product.discount_expires_at) {
        const expiry = new Date(product.discount_expires_at).getTime();
        const now = new Date().getTime();
        if (isNaN(expiry) || expiry <= now) {
            return false; // Discount has expired!
        }
    }

    return true;
}

/**
 * Returns the active selling price for a product.
 * If a discount is active, returns current discount price.
 * If expired, returns the original price.
 */
export function getEffectivePrice(product: Product): number {
    if (isDiscountActive(product)) {
        return Number(product.price);
    }
    return Number(product.original_price || product.price);
}

/**
 * Returns human-readable countdown string for a discount expiration date.
 */
export function getDiscountCountdown(expiresAt?: string | null): string | null {
    if (!expiresAt) return null;

    const expiry = new Date(expiresAt).getTime();
    const now = new Date().getTime();

    if (isNaN(expiry)) return null;

    const diffMs = expiry - now;

    if (diffMs <= 0) {
        return "Expired";
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    if (diffDays >= 1) {
        return `Ends in ${diffDays}d ${remainingHours}h`;
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60)) % 60;
    if (diffHours >= 1) {
        return `Ends in ${diffHours}h ${diffMinutes}m`;
    }

    return `Ends in ${diffMinutes}m`;
}

/**
 * Helper to compute an ISO expiration string given a duration option.
 * Options: '1day', '3days', '7days', '14days', '30days' or custom.
 */
export function getExpiryDateFromDuration(durationKey: string): string | null {
    if (!durationKey || durationKey === "never") return null;

    const now = new Date();
    let daysToAdd = 1;

    if (durationKey === "1day") daysToAdd = 1;
    else if (durationKey === "3days") daysToAdd = 3;
    else if (durationKey === "7days") daysToAdd = 7;
    else if (durationKey === "14days") daysToAdd = 14;
    else if (durationKey === "30days") daysToAdd = 30;
    else {
        const parsed = parseInt(durationKey, 10);
        if (!isNaN(parsed) && parsed > 0) daysToAdd = parsed;
    }

    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString();
}
