"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, CreditCard, Search } from "lucide-react";
import { toast } from "sonner";

export default function SecondHandBookingsPage() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!user?.id) return;
        fetchBookings(user.id);
    }, [user?.id]);

    async function fetchBookings(ownerId: string) {
        setLoading(true);
        const { data, error } = await supabase
            .from("second_hand_bookings")
            .select("*")
            .eq("owner_id", ownerId)
            .order("created_at", { ascending: false });

        if (!error && data) {
            setBookings(data);
        } else if (error) {
            setBookings([]);
            toast.error("Bookings-ka lama soo qaadi karin: " + error.message);
        }
        setLoading(false);
    }

    async function updateStatus(id: string, status: string) {
        if (!user?.id) return;
        const { error } = await supabase
            .from("second_hand_bookings")
            .update({ status })
            .eq("id", id)
            .eq("owner_id", user.id);

        if (!error) {
            toast.success(
                status === "fully_paid"
                    ? "🎉 Lacagtii dhimanayd waa la dhamaystiray (Fully Paid)!"
                    : `Status-ka waxaa loo baddalay ${status}`
            );
            fetchBookings(user.id);
        } else {
            toast.error("Failed to update status: " + error.message);
        }
    }

    const filteredBookings = bookings.filter((b) =>
        (b.item_title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.user_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.transaction_phone || "").includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <PageHeader title="Second-Hand Bookings (Deposits & Settlements)" description="Manage 10% deposits and remaining balance settlements for second-hand items." />

            {/* Navigation Quick Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-sm font-bold overflow-x-auto">
                <a
                    href="/second-hand"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                    🏷️ Alaabta (Listings)
                </a>
                <a
                    href="/second-hand/bookings"
                    className="px-4 py-2 rounded-xl bg-primary text-white shadow-sm flex items-center gap-2 whitespace-nowrap"
                >
                    📅 Koodhadha / Deposits ({bookings.length})
                </a>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Search className="h-5 w-5 text-slate-400 ml-2" />
                <Input
                    placeholder="Raadi alaabta (Item title), magaca ama telefoonka macmiilka..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none focus-visible:ring-0 text-sm"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                            <tr>
                                <th className="py-3 px-4">Item</th>
                                <th className="py-3 px-4">User Details</th>
                                <th className="py-3 px-4">Total / Deposit (10%)</th>
                                <th className="py-3 px-4">Lacagta Dhiman (90%)</th>
                                <th className="py-3 px-4">Transaction Info</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-slate-500">Loading bookings...</td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-slate-500">Wax alaab ah oo raadintaada ku soo baxay ma jiro.</td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => {
                                    const depositNum = Number(booking.deposit_amount) || 0;
                                    const totalPrice = Number(booking.total_price) || (depositNum * 10);
                                    const remainingNum = booking.remaining_amount ? Number(booking.remaining_amount) : (totalPrice - depositNum);
                                    const isFullyPaid = booking.status === "fully_paid";

                                    return (
                                        <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-800">{booking.item_title}</td>
                                            <td className="py-3 px-4">
                                                <div className="text-slate-800 font-medium">{booking.user_name}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-slate-400 text-xs line-through mb-0.5">Total: ${totalPrice.toFixed(2)}</div>
                                                <div className="font-bold text-slate-900">Deposit: ${depositNum.toFixed(2)} (10%)</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {isFullyPaid ? (
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                        $0.00 (Fully Paid)
                                                    </span>
                                                ) : (
                                                    <div className="font-extrabold text-rose-600">
                                                        ${remainingNum.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">(90% Dhiman)</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-slate-500 text-xs">{booking.transaction_phone}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize
                                                    ${isFullyPaid ? "bg-purple-100 text-purple-700 border border-purple-200" :
                                                        booking.status === "approved" ? "bg-green-50 text-green-600 border border-green-200" :
                                                            booking.status === "cancelled" ? "bg-red-50 text-red-600 border border-red-200" :
                                                                "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                                                    {isFullyPaid ? "Fully Paid 🎉" : (booking.status || "pending")}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-2">
                                                {booking.status === "pending" && (
                                                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 gap-1" onClick={() => updateStatus(booking.id, "approved")}>
                                                        <CheckCircle className="h-4 w-4" /> Approve
                                                    </Button>
                                                )}

                                                {booking.status === "approved" && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold gap-1 text-xs shadow-sm"
                                                        onClick={() => updateStatus(booking.id, "fully_paid")}
                                                    >
                                                        <CreditCard className="h-3.5 w-3.5" /> 💳 Dhamaystir Lacagta (${remainingNum.toFixed(2)})
                                                    </Button>
                                                )}

                                                {booking.status !== "cancelled" && booking.status !== "fully_paid" && (
                                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1" onClick={() => updateStatus(booking.id, "cancelled")}>
                                                        <XCircle className="h-4 w-4" /> Reject
                                                    </Button>
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
