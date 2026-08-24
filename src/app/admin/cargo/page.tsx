"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Plus, Trash2, CheckCircle2, XSquare } from "lucide-react";
import { toast } from "sonner";

export default function CargoAdsPage() {
    const [cargoAds, setCargoAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [route, setRoute] = useState("");
    const [price, setPrice] = useState("");
    const [contact, setContact] = useState("");

    const fetchAds = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("cargo_ads")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setCargoAds(data || []);
        } catch (err: any) {
            toast.error("Failed to load cargo ads: " + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAds();
    }, [fetchAds]);

    async function toggleStatus(id: string, currentStatus: boolean) {
        try {
            const { error } = await supabase
                .from("cargo_ads")
                .update({ is_active: !currentStatus })
                .eq("id", id);

            if (error) throw error;
            toast.success("Ad status toggled!");
            fetchAds();
        } catch (err: any) {
            toast.error("Failed to update status: " + err.message);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this cargo ad?")) return;
        try {
            const { error } = await supabase.from("cargo_ads").delete().eq("id", id);
            if (error) throw error;
            toast.success("Ad deleted successfully!");
            fetchAds();
        } catch (err: any) {
            toast.error("Failed to delete ad: " + err.message);
        }
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!title || !route || !price || !contact) {
            toast.error("Please fill in all details");
            return;
        }

        try {
            const { error } = await supabase.from("cargo_ads").insert([
                {
                    title,
                    route,
                    price: parseFloat(price),
                    contact,
                    is_active: true,
                },
            ]);

            if (error) throw error;

            toast.success("Cargo Ad posted successfully!");
            setShowAddForm(false);
            setTitle("");
            setRoute("");
            setPrice("");
            setContact("");
            fetchAds();
        } catch (err: any) {
            toast.error("Failed to post cargo ad: " + err.message);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Cargo & Transport Ads"
                    description="Manage routes, logistics cargo postings, and client advertisements"
                />
                <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Cargo Ad
                </Button>
            </div>

            {showAddForm && (
                <Card className="max-w-2xl border-slate-205 shadow-sm bg-slate-50/50">
                    <CardContent className="p-6">
                        <h3 className="text-base font-bold text-slate-800 mb-4">Post New Cargo Route</h3>
                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Ad Title</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Heavy Truck Cargo Transit" />
                            </div>
                            <div className="space-y-1">
                                <Label>Route transit segment</Label>
                                <Input value={route} onChange={(e) => setRoute(e.target.value)} required placeholder="e.g. Mogadishu to Garowe" />
                            </div>
                            <div className="space-y-1">
                                <Label>Freight Charge Price ($)</Label>
                                <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="e.g. 350.00" />
                            </div>
                            <div className="space-y-1">
                                <Label>Contact Number / Coordinator</Label>
                                <Input value={contact} onChange={(e) => setContact(e.target.value)} required placeholder="e.g. +25261xxxxxxx" />
                            </div>
                            <div className="md:col-span-2 pt-2 flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                                <Button type="submit">Publish Cargo Ad</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="py-12 flex justify-center text-slate-400">Loading Cargo Ads...</div>
            ) : cargoAds.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                    No Cargo advertisements posted yet.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="py-4 px-6">Advertisement Title</th>
                                    <th className="py-4 px-6">Route / Logistics</th>
                                    <th className="py-4 px-6 text-right">Freight Price</th>
                                    <th className="py-4 px-6">Contact details</th>
                                    <th className="py-4 px-6 text-center">Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cargoAds.map((ad) => (
                                    <tr key={ad.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-slate-800">
                                            {ad.title}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-emerald-500" />
                                                <span className="font-medium text-slate-700">{ad.route}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-bold text-slate-900">
                                            ${Number(ad.price || 0).toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 font-medium text-slate-600">
                                            {ad.contact}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold select-none border ${ad.is_active
                                                    ? "bg-green-50 text-green-600 border-green-200"
                                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                                }`}>
                                                {ad.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className={ad.is_active ? "text-slate-500 border-slate-200 hover:bg-slate-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}
                                                onClick={() => toggleStatus(ad.id, ad.is_active)}
                                            >
                                                {ad.is_active ? "Deactivate" : "Activate"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(ad.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
