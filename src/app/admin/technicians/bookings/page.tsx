"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    Clock,
    Check,
    XCircle,
    Search,
    Zap,
    Users,
    DollarSign,
    Calendar,
    MapPin,
    UserCheck,
    Wrench,
    UserPlus,
} from "lucide-react";
import { toast } from "sonner";

export interface TechBooking {
    id: string;
    category?: string;
    level?: string;
    price?: string;
    details?: string;
    location?: string;
    user_name?: string;
    user_id?: string;
    phone?: string;
    status?: string;
    is_paid?: boolean;
    transaction_id?: string;
    assigned_tech_id?: string;
    assigned_tech_name?: string;
    assigned_tech_phone?: string;
    created_at?: string;
}

export interface RegisteredTechnician {
    id: string;
    name: string;
    phone: string;
    specialty: string;
    level?: string;
    location?: string;
    is_active: boolean;
}

export default function TechnicianBookingsPage() {
    const [bookings, setBookings] = useState<TechBooking[]>([]);
    const [technicians, setTechnicians] = useState<RegisteredTechnician[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch bookings
            const { data: bookingsData, error: bError } = await supabase
                .from("tech_bookings")
                .select("*")
                .order("created_at", { ascending: false });

            if (bError) {
                console.warn("tech_bookings notice:", bError.message);
                const saved = localStorage.getItem("emara_tech_bookings");
                if (saved) setBookings(JSON.parse(saved));
            } else if (bookingsData) {
                setBookings(bookingsData);
            }

            // 2. Fetch technicians list
            const { data: techData, error: tError } = await supabase
                .from("technicians")
                .select("*")
                .eq("is_active", true)
                .order("name", { ascending: true });

            if (!tError && techData) {
                setTechnicians(techData);
            } else {
                const savedTechs = localStorage.getItem("emara_technicians");
                if (savedTechs) setTechnicians(JSON.parse(savedTechs));
            }
        } catch (err: any) {
            console.warn("Could not fetch data:", err?.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    async function assignTechnician(bookingId: string, techId: string) {
        const tech = technicians.find((t) => t.id === techId);
        if (!tech) return;

        try {
            // Update Supabase
            const { error } = await supabase
                .from("tech_bookings")
                .update({
                    assigned_tech_id: tech.id,
                    assigned_tech_name: tech.name,
                    assigned_tech_phone: tech.phone,
                    status: "in_progress",
                })
                .eq("id", bookingId);

            if (error) console.warn("assign error:", error.message);

            const updated = bookings.map((b) =>
                b.id === bookingId
                    ? {
                        ...b,
                        assigned_tech_id: tech.id,
                        assigned_tech_name: tech.name,
                        assigned_tech_phone: tech.phone,
                        status: "in_progress",
                    }
                    : b
            );

            setBookings(updated);
            localStorage.setItem("emara_tech_bookings", JSON.stringify(updated));

            toast.success(`👨‍🔧 Dalabkaan waxaa loo aadiyay: ${tech.name} (${tech.phone})!`);
        } catch (err: any) {
            toast.error("Failed to assign technician: " + err.message);
        }
    }

    async function updateStatus(id: string, newStatus: string) {
        try {
            const { error } = await supabase
                .from("tech_bookings")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) console.warn("tech_bookings update notice:", error.message);

            const updated = bookings.map((b) => (b.id === id ? { ...b, status: newStatus } : b));
            setBookings(updated);
            localStorage.setItem("emara_tech_bookings", JSON.stringify(updated));

            toast.success(
                newStatus === "done" || newStatus === "completed"
                    ? "✅ Dalabka shaqada farsamada waa la dhameystiray (Done)!"
                    : newStatus === "in_progress"
                        ? "🔄 Shaqada farsamo yaqaanka waa socotaa (In Progress)!"
                        : `Xaalada dalabka waxaa loo baddalay: ${newStatus}`
            );
        } catch (err: any) {
            toast.error("Failed to update status: " + err.message);
        }
    }

    const filteredBookings = bookings.filter(
        (b) =>
            (b.user_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.phone || "").includes(searchTerm) ||
            (b.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.assigned_tech_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.location || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title="Maareynta & Ku Aadinta Dalabyada Farsamada (Technician Assignment)"
                    description="Ku aadi dalab kasta farsamo yaqaanka ku habboon, marka shaqadu dhamaatana taabo Done ✅."
                />
            </div>

            {/* Navigation Quick Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-sm font-bold">
                <Link
                    href="/admin/technicians"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                    <Users className="h-4 w-4" /> 👨‍🔧 Farsamo Yaqaanno ({technicians.length})
                </Link>
                <Link
                    href="/admin/technicians/pricing"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                    <DollarSign className="h-4 w-4 text-emerald-600" /> 💵 Lacagaha Farsamada (Rates)
                </Link>
                <Link
                    href="/admin/technicians/bookings"
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white shadow-sm flex items-center gap-2"
                >
                    <Calendar className="h-4 w-4" /> 📅 Dalabyada (Bookings) ({bookings.length})
                </Link>
            </div>

            {/* Live Search Bar */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Search className="h-5 w-5 text-slate-400 ml-2" />
                <Input
                    placeholder="Raadi magaca macmiilka, farsamo yaqaanka loo aadiyay, telefoonka ama qaybta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none focus-visible:ring-0 text-sm"
                />
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                            <tr>
                                <th className="py-3.5 px-4">Macmiilka (Client)</th>
                                <th className="py-3.5 px-4">Qaybta & Heerka</th>
                                <th className="py-3.5 px-4">Farsamo Yaqaanka Loo Aadiyay</th>
                                <th className="py-3.5 px-4 text-right">Qiimaha</th>
                                <th className="py-3.5 px-4 text-center">Bixinta (Payment)</th>
                                <th className="py-3.5 px-4 text-center">Xaaladda (Status)</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                                        Dalabyada farsamo yaqaannada waa la soo rarayaa...
                                    </td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-slate-500 font-medium">
                                        Wali dalab farsamo oo la sameeyay ma jiro (No bookings found).
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((b) => {
                                    const status = (b.status || "pending").toLowerCase();
                                    const isDone = status === "done" || status === "completed";
                                    const isInProgress = status === "in_progress" || status === "confirmed";

                                    // Filter technicians strictly matching this booking category specialty
                                    const categoryClean = (b.category || "").toLowerCase();
                                    const matchingTechs = technicians.filter((t) => {
                                        const techSpecialtyClean = (t.specialty || "").toLowerCase();
                                        if (!categoryClean) return true;
                                        // Check direct keyword inclusion or overlap
                                        return (
                                            techSpecialtyClean.includes(categoryClean) ||
                                            categoryClean.includes(techSpecialtyClean) ||
                                            (categoryClean.includes("koron") && techSpecialtyClean.includes("koron")) ||
                                            (categoryClean.includes("ac") && techSpecialtyClean.includes("ac")) ||
                                            (categoryClean.includes("qaboojiy") && techSpecialtyClean.includes("qaboojiy")) ||
                                            (categoryClean.includes("tuub") && techSpecialtyClean.includes("tuub")) ||
                                            (categoryClean.includes("plumb") && techSpecialtyClean.includes("plumb")) ||
                                            (categoryClean.includes("qasaal") && techSpecialtyClean.includes("qasaal")) ||
                                            (categoryClean.includes("solar") && techSpecialtyClean.includes("solar"))
                                        );
                                    });

                                    return (
                                        <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                                            {/* Client Details */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900">{b.user_name || "Macmiil"}</div>
                                                <div className="text-xs text-slate-500 font-mono">{b.phone || "N/A"}</div>
                                                <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-0.5">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{b.location || "Mogadishu"}</span>
                                                </div>
                                            </td>

                                            {/* Category & Level */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-800">{b.category || "Adeeg Farsamo"}</div>
                                                <Badge variant="secondary" className="text-[10px] font-bold mt-0.5">
                                                    {b.level || "Heer Sare"}
                                                </Badge>
                                            </td>

                                            {/* Assign Technician Select & Display */}
                                            <td className="py-3.5 px-4">
                                                {b.assigned_tech_name ? (
                                                    <div className="space-y-1">
                                                        <div className="font-extrabold text-blue-900 flex items-center gap-1.5 text-xs">
                                                            <UserCheck className="h-4 w-4 text-blue-600" />
                                                            {b.assigned_tech_name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 font-mono pl-5">
                                                            📞 {b.assigned_tech_phone || "N/A"}
                                                        </div>

                                                        {!isDone && (
                                                            <select
                                                                defaultValue=""
                                                                onChange={(e) => assignTechnician(b.id, e.target.value)}
                                                                className="mt-1 text-[11px] h-7 px-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-medium focus:outline-none"
                                                            >
                                                                <option value="" disabled>
                                                                    🔄 Badal Farsamo Yaqaanka ({b.category || "Xirfadda"})...
                                                                </option>
                                                                {(matchingTechs.length > 0 ? matchingTechs : technicians).map((t) => (
                                                                    <option key={t.id} value={t.id}>
                                                                        👨‍🔧 {t.name} - {t.specialty} ({t.phone})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                            ⚠️ Wali La Ma Aadin
                                                        </span>

                                                        {matchingTechs.length > 0 ? (
                                                            <select
                                                                defaultValue=""
                                                                onChange={(e) => assignTechnician(b.id, e.target.value)}
                                                                className="mt-1.5 w-full h-8 px-2 border border-blue-300 rounded-lg bg-blue-50/70 text-blue-900 font-extrabold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                            >
                                                                <option value="" disabled>
                                                                    🎯 Door Farsamo Yaqaan ({b.category})...
                                                                </option>
                                                                {matchingTechs.map((t) => (
                                                                    <option key={t.id} value={t.id}>
                                                                        👨‍🔧 {t.name} ({t.specialty}) - {t.phone}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <div className="space-y-1 mt-1">
                                                                <div className="text-[11px] font-bold text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-200">
                                                                    ❌ Ma jiro farsamo yaqaan leh xirfadda ({b.category})
                                                                </div>
                                                                <select
                                                                    defaultValue=""
                                                                    onChange={(e) => assignTechnician(b.id, e.target.value)}
                                                                    className="w-full h-7 px-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-[11px]"
                                                                >
                                                                    <option value="" disabled>
                                                                        ⚠️ Eeg dhammaan farsamo yaqaannada...
                                                                    </option>
                                                                    {technicians.map((t) => (
                                                                        <option key={t.id} value={t.id}>
                                                                            👨‍🔧 {t.name} ({t.specialty}) - {t.phone}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Price */}
                                            <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono">
                                                ${b.price || "0.00"}
                                            </td>

                                            {/* Payment Info */}
                                            <td className="py-3.5 px-4 text-center">
                                                {b.is_paid ? (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-extrabold">
                                                        <Zap className="h-3 w-3 text-emerald-600 fill-emerald-600" /> ⚡ WAAFI Paid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                        💵 Unpaid / Cash
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black capitalize border ${isDone
                                                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                                        : isInProgress
                                                            ? "bg-blue-100 text-blue-800 border-blue-200"
                                                            : status === "cancelled" || status === "rejected"
                                                                ? "bg-red-100 text-red-700 border-red-200"
                                                                : "bg-amber-100 text-amber-800 border-amber-200"
                                                        }`}
                                                >
                                                    {isDone ? "Done ✅" : isInProgress ? "In Progress 🔄" : "Pending ⏳"}
                                                </span>
                                            </td>

                                            {/* Actions: DONE BUTTON */}
                                            <td className="py-3.5 px-4 text-right space-x-1.5">
                                                {!isDone ? (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-sm gap-1.5"
                                                        onClick={() => updateStatus(b.id, "done")}
                                                    >
                                                        <CheckCircle className="h-4 w-4" /> Done ✅
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                        🎉 Waa La Dhameeyay
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
