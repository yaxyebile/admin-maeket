"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Check, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function TechnicianBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch bookings
            const { data: bookingsData, error: bookingsError } = await supabase
                .from("technician_bookings")
                .select("*")
                .order("created_at", { ascending: false });

            if (bookingsError) throw bookingsError;

            // 2. Fetch technicians list
            const { data: techData } = await supabase
                .from("technicians")
                .select("id, name, specialty");

            const techMap: Record<string, any> = {};
            (techData || []).forEach((t) => {
                techMap[t.id] = t;
            });

            // 3. Fetch user profiles for clients name
            const { data: profilesData } = await supabase
                .from("profiles")
                .select("id, name, phone");

            const profileMap: Record<string, any> = {};
            (profilesData || []).forEach((p) => {
                profileMap[p.id] = p;
            });

            // 4. Merge results
            const merged = (bookingsData || []).map((b) => ({
                ...b,
                technician_name: techMap[b.technician_id]?.name || "Unknown Technician",
                technician_specialty: techMap[b.technician_id]?.specialty || "General",
                client_name: profileMap[b.user_id]?.name || b.user_name || "Client",
                client_phone: profileMap[b.user_id]?.phone || b.user_phone || "N/A",
            }));

            setBookings(merged);
        } catch (err: any) {
            toast.error("Failed to load bookings: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    async function updateStatus(id: string, newStatus: string) {
        try {
            const { error } = await supabase
                .from("technician_bookings")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) throw error;
            toast.success(`Booking status updated to ${newStatus}`);
            fetchBookings();
        } catch (err: any) {
            toast.error("Failed to update status: " + err.message);
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Technician Service Bookings"
                description="Monitor, approve, and finalize technician scheduling bookings"
            />

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6">Technician</th>
                                <th className="py-4 px-6">Client Info</th>
                                <th className="py-4 px-6">Service Type</th>
                                <th className="py-4 px-6 text-right">Price Charged</th>
                                <th className="py-4 px-6 text-center">Status</th>
                                <th className="py-4 px-6 text-right">Progress Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-450 font-medium">
                                        Loading service bookings list...
                                    </td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-450">
                                        No booked technician requests found at this time.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-slate-800">{booking.technician_name}</div>
                                            <div className="text-xs text-slate-500">{booking.technician_specialty}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-slate-800">{booking.client_name}</div>
                                            <div className="text-xs text-slate-500 font-mono">{booking.client_phone}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="bg-slate-100 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize">
                                                {booking.service_type || "General Service"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right font-semibold text-slate-900">
                                            ${Number(booking.price || 0).toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize select-none border ${booking.status === "completed"
                                                        ? "bg-green-50 text-green-600 border-green-200"
                                                        : booking.status === "confirmed"
                                                            ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                                            : booking.status === "rejected" || booking.status === "cancelled"
                                                                ? "bg-red-50 text-red-650 border-red-200"
                                                                : "bg-amber-50 text-amber-600 border-amber-200"
                                                    }`}
                                            >
                                                {booking.status || "pending"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            {/* Lifecycle: pending -> confirmed -> completed */}
                                            {(!booking.status || booking.status === "pending") && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-indigo-50 border-indigo-150 text-indigo-600 hover:bg-indigo-100"
                                                        onClick={() => updateStatus(booking.id, "confirmed")}
                                                    >
                                                        Confirm Booking
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-red-50 border-red-150 text-red-600 hover:bg-red-100"
                                                        onClick={() => updateStatus(booking.id, "rejected")}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}

                                            {booking.status === "confirmed" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-green-50 border-green-150 text-green-600 hover:bg-green-100"
                                                    onClick={() => updateStatus(booking.id, "completed")}
                                                >
                                                    Mark Completed
                                                </Button>
                                            )}

                                            {booking.status === "completed" && (
                                                <span className="text-xs text-slate-400 font-medium inline-flex items-center gap-1">
                                                    <Check className="h-3.5 w-3.5 text-green-500" /> Finished
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
