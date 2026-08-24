"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Wrench, Phone, Check, Plus, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function TechniciansPage() {
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [phone, setPhone] = useState("");
    const [description, setDescription] = useState("");
    const [rate, setRate] = useState("");

    useEffect(() => {
        fetchTechnicians();
    }, []);

    async function fetchTechnicians() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("technicians")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;
            setTechnicians(data || []);
        } catch (err: any) {
            toast.error("Failed to load technicians: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function toggleAvailability(id: string, currentStatus: boolean) {
        try {
            const { error } = await supabase
                .from("technicians")
                .update({ is_available: !currentStatus })
                .eq("id", id);

            if (error) throw error;
            toast.success("Availability updated successfully");
            fetchTechnicians();
        } catch (err: any) {
            toast.error("Failed to toggle status: " + err.message);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this technician?")) return;
        try {
            const { error } = await supabase.from("technicians").delete().eq("id", id);
            if (error) throw error;
            toast.success("Technician deleted");
            fetchTechnicians();
        } catch (err: any) {
            toast.error("Failed to delete technician: " + err.message);
        }
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!name || !specialty || !phone) {
            toast.error("Please fill in name, specialty, and phone number.");
            return;
        }

        try {
            const { error } = await supabase.from("technicians").insert([
                {
                    name,
                    specialty,
                    phone,
                    description: description || null,
                    rate: rate ? parseFloat(rate) : null,
                    is_available: true,
                },
            ]);

            if (error) throw error;

            toast.success("Technician registered successfully!");
            setShowAddForm(false);
            setName("");
            setSpecialty("");
            setPhone("");
            setDescription("");
            setRate("");
            fetchTechnicians();
        } catch (err: any) {
            toast.error("Registration failed: " + err.message);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Technicians Directory"
                    description="Register and manage mobile marketplace technicians"
                />
                <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
                    <Plus className="h-4 w-4" /> Register Technician
                </Button>
            </div>

            {showAddForm && (
                <Card className="max-w-2xl border-slate-205 shadow-sm bg-slate-50/50">
                    <CardContent className="p-6">
                        <h3 className="text-base font-bold text-slate-800 mb-4">Register New Service Provider</h3>
                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Technician Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Maxamed Cali" />
                            </div>
                            <div className="space-y-1">
                                <Label>Specialty / Skill</Label>
                                <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} required placeholder="e.g. Electrician, Plumber" />
                            </div>
                            <div className="space-y-1">
                                <Label>Phone Number</Label>
                                <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. +25261xxxxxxx" />
                            </div>
                            <div className="space-y-1">
                                <Label>Service Rate per hour ($)</Label>
                                <Input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 15.00" />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <Label>Short Description / Experience details</Label>
                                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Over 5 years repairing solar grids and domestic wiring" />
                            </div>
                            <div className="md:col-span-2 pt-2 flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                                <Button type="submit">Submit Registration</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="py-12 flex justify-center text-slate-400">Loading technician data...</div>
            ) : technicians.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                    No technicians registered yet.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {technicians.map((t) => (
                        <Card key={t.id} className="bg-white border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-2 h-full ${t.is_available ? 'bg-green-500' : 'bg-slate-350'}`} />
                            <CardContent className="p-5 pl-7 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-base">{t.name}</h4>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-block mt-1 font-medium">{t.specialty}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(t.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="text-sm text-slate-500 min-h-10">
                                    {t.description || "No description provided."}
                                </div>

                                <div className="flex flex-col gap-1 border-t border-slate-50 pt-3 text-xs text-slate-650">
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <Phone className="h-3.5 w-3.5 text-slate-450" />
                                        <span>{t.phone}</span>
                                    </div>
                                    {t.rate !== null && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="font-bold text-slate-800">${t.rate}/hr</span>
                                            <span className="text-slate-400 font-normal">base charge rate</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">
                                    <span className="text-xs font-semibold text-slate-600">Available for hire</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold ${t.is_available ? 'text-green-600' : 'text-slate-400'}`}>
                                            {t.is_available ? 'ACTIVE' : 'OFFLINE'}
                                        </span>
                                        <button
                                            onClick={() => toggleAvailability(t.id, t.is_available)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-205 focus:outline-none ${t.is_available ? 'bg-green-500' : 'bg-slate-300'
                                                }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-205 ${t.is_available ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
