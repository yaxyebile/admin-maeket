"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export default function SecondHandBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    async function fetchBookings() {
        setLoading(true);
        const { data, error } = await supabase
            .from("second_hand_bookings")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setBookings(data);
        }
        setLoading(false);
    }

    async function updateStatus(id: string, status: string) {
        const { error } = await supabase
            .from("second_hand_bookings")
            .update({ status })
            .eq("id", id);

        if (!error) {
            fetchBookings();
        } else {
            alert("Failed to update status: " + error.message);
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Second-Hand Bookings (Deposits)" description="Manage 10% deposits for second-hand items." />

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                            <tr>
                                <th className="py-3 px-4">Item</th>
                                <th className="py-3 px-4">User Details</th>
                                <th className="py-3 px-4">Total / Deposit (10%)</th>
                                <th className="py-3 px-4">Transaction Info</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-500">Loading bookings...</td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-500">No bookings found.</td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-slate-800">{booking.item_title}</td>
                                        <td className="py-3 px-4">
                                            <div className="text-slate-800">{booking.user_name}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-slate-500 text-xs line-through mb-1">Total: {booking.total_price}</div>
                                            <div className="font-medium text-slate-900">Deposit: {booking.deposit_amount}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-slate-500 text-xs">{booking.transaction_phone}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize
                        ${booking.status === "approved" ? "bg-green-50 text-green-600" :
                                                    booking.status === "cancelled" ? "bg-red-50 text-red-600" :
                                                        "bg-amber-50 text-amber-600"}`}>
                                                {booking.status || "pending"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right space-x-2">
                                            {booking.status !== "approved" && (
                                                <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 gap-1" onClick={() => updateStatus(booking.id, "approved")}>
                                                    <CheckCircle className="h-4 w-4" /> Approve
                                                </Button>
                                            )}
                                            {booking.status !== "cancelled" && (
                                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1" onClick={() => updateStatus(booking.id, "cancelled")}>
                                                    <XCircle className="h-4 w-4" /> Reject
                                                </Button>
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
