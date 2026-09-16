"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Filter, RotateCcw } from "lucide-react";

export type DateFilterPreset = "all" | "today" | "week" | "month" | "custom";

export interface DateFilterState {
    preset: DateFilterPreset;
    startDate?: string;
    endDate?: string;
}

interface DateRangeFilterProps {
    value: DateFilterState;
    onChange: (newValue: DateFilterState) => void;
    className?: string;
}

export function DateRangeFilter({
    value,
    onChange,
    className = "",
}: DateRangeFilterProps) {
    const [showCustomInput, setShowCustomInput] = useState(
        value.preset === "custom"
    );

    const handlePresetSelect = (preset: DateFilterPreset) => {
        if (preset === "custom") {
            setShowCustomInput(true);
            onChange({ ...value, preset: "custom" });
        } else {
            setShowCustomInput(false);
            onChange({ preset, startDate: undefined, endDate: undefined });
        }
    };

    return (
        <div className={`bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3 ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        Loo Kala Sifeeyay Waqtiga (Filter Period):
                    </span>
                </div>

                {/* Presets Toggle Group */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePresetSelect("all")}
                        className={`h-7 px-3 text-xs font-bold rounded-lg transition-all ${value.preset === "all"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:bg-slate-200/60"
                            }`}
                    >
                        Dhamaan (All Time)
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePresetSelect("today")}
                        className={`h-7 px-3 text-xs font-bold rounded-lg transition-all ${value.preset === "today"
                                ? "bg-white text-emerald-600 shadow-xs"
                                : "text-slate-600 hover:bg-slate-200/60"
                            }`}
                    >
                        📅 Maalinle (Today)
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePresetSelect("week")}
                        className={`h-7 px-3 text-xs font-bold rounded-lg transition-all ${value.preset === "week"
                                ? "bg-white text-indigo-600 shadow-xs"
                                : "text-slate-600 hover:bg-slate-200/60"
                            }`}
                    >
                        🗓️ Isbuucle (This Week)
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePresetSelect("month")}
                        className={`h-7 px-3 text-xs font-bold rounded-lg transition-all ${value.preset === "month"
                                ? "bg-white text-purple-600 shadow-xs"
                                : "text-slate-600 hover:bg-slate-200/60"
                            }`}
                    >
                        📊 Bille (This Month)
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePresetSelect("custom")}
                        className={`h-7 px-3 text-xs font-bold rounded-lg transition-all ${value.preset === "custom"
                                ? "bg-white text-rose-600 shadow-xs"
                                : "text-slate-600 hover:bg-slate-200/60"
                            }`}
                    >
                        🗓️ Bil ilaa Bil (Custom Range)
                    </Button>
                </div>
            </div>

            {/* Custom Date Range Picker inputs */}
            {(showCustomInput || value.preset === "custom") && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-500">Kala bilow (From):</span>
                        <Input
                            type="date"
                            value={value.startDate || ""}
                            onChange={(e) =>
                                onChange({ ...value, preset: "custom", startDate: e.target.value })
                            }
                            className="h-8 text-xs font-bold w-auto"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-500">U dhamee (To):</span>
                        <Input
                            type="date"
                            value={value.endDate || ""}
                            onChange={(e) =>
                                onChange({ ...value, preset: "custom", endDate: e.target.value })
                            }
                            className="h-8 text-xs font-bold w-auto"
                        />
                    </div>

                    {(value.startDate || value.endDate) && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePresetSelect("all")}
                            className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 ml-auto"
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Nadiifi (Reset)
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

/** Helper function to filter records by date field */
export function filterRecordsByDate<T>(
    records: T[],
    getDateIso: (item: T) => string | undefined,
    filterState: DateFilterState
): T[] {
    if (filterState.preset === "all") return records;

    const now = new Date();

    if (filterState.preset === "today") {
        const todayStr = now.toISOString().slice(0, 10);
        return records.filter((r) => {
            const iso = getDateIso(r);
            return iso ? iso.slice(0, 10) === todayStr : false;
        });
    }

    if (filterState.preset === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return records.filter((r) => {
            const iso = getDateIso(r);
            if (!iso) return false;
            const d = new Date(iso);
            return d >= weekAgo && d <= now;
        });
    }

    if (filterState.preset === "month") {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        return records.filter((r) => {
            const iso = getDateIso(r);
            if (!iso) return false;
            const d = new Date(iso);
            return d >= monthAgo && d <= now;
        });
    }

    if (filterState.preset === "custom") {
        const start = filterState.startDate ? new Date(filterState.startDate) : null;
        const end = filterState.endDate ? new Date(filterState.endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return records.filter((r) => {
            const iso = getDateIso(r);
            if (!iso) return false;
            const d = new Date(iso);
            if (start && d < start) return false;
            if (end && d > end) return false;
            return true;
        });
    }

    return records;
}
