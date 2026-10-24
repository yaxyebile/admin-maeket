"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import type { Store } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DualImageInput } from "@/components/dual-image-input";
import { toast } from "sonner";
import { Settings, Save, Utensils } from "lucide-react";

export default function RestaurantSettingsPage() {
    const { user } = useAuth();
    const [store, setStore] = useState<Store | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        contact: "",
        logo: "",
        banner: "",
        evc_number: "",
        edahab_number: "",
    });

    const loadData = useCallback(async () => {
        const { data } = await supabase.from("stores").select("*");
        const allStores = (data as Store[]) ?? [];
        let myStore = allStores.find((s) => s.owner_id === user?.id && (s.is_restaurant || s.name.toLowerCase().includes("restaurant")));
        if (!myStore && allStores.length > 0) {
            myStore = allStores.find((s) => s.is_restaurant) || allStores[0];
        }
        if (myStore) {
            setStore(myStore);
            setForm({
                name: myStore.name,
                description: myStore.description || "",
                contact: myStore.contact || "",
                logo: myStore.logo || "",
                banner: myStore.banner || "",
                evc_number: myStore.evc_number || "",
                edahab_number: myStore.edahab_number || "",
            });
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!store) return;
        setSaving(true);
        const { error } = await supabase
            .from("stores")
            .update({
                name: form.name,
                description: form.description,
                contact: form.contact,
                logo: form.logo,
                banner: form.banner,
                evc_number: form.evc_number || null,
                edahab_number: form.edahab_number || null,
            })
            .eq("id", store.id);

        setSaving(false);
        if (error) toast.error(error.message);
        else toast.success("✅ Maqaayada settings-keeda waa la kaydiyay");
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 p-6 rounded-3xl text-white shadow-xl">
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black uppercase">
                    RESTAURANT SETTINGS
                </span>
                <h1 className="text-2xl sm:text-3xl font-black mt-2">
                    Maqaayada Settings & Credentials
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                    Cusbooneysii magaca maqaayada, logo-ga, sharaxaada, iyo EVC/eDahab numbers.
                </p>
            </div>

            <Card className="max-w-2xl bg-slate-900 border-slate-800 rounded-3xl text-white p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-300">Magaca Maqaayada</Label>
                        <Input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="bg-slate-950 border-slate-800 rounded-xl text-xs text-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-300">Sharaxaada (Description)</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="bg-slate-950 border-slate-800 rounded-xl text-xs text-white"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <DualImageInput
                            label="Logo-ga Maqaayada (Logo)"
                            value={form.logo}
                            onChange={(url) => setForm({ ...form, logo: url })}
                            bucket="logos"
                        />
                        <DualImageInput
                            label="Banner-ka Maqaayada (Cover Banner)"
                            value={form.banner}
                            onChange={(url) => setForm({ ...form, banner: url })}
                            bucket="banners"
                        />
                    </div>

                    <div className="grid gap-4 grid-cols-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-300">EVC Plus Number</Label>
                            <Input
                                value={form.evc_number}
                                onChange={(e) => setForm({ ...form, evc_number: e.target.value })}
                                className="bg-slate-950 border-slate-800 rounded-xl text-xs text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-300">eDahab Number</Label>
                            <Input
                                value={form.edahab_number}
                                onChange={(e) => setForm({ ...form, edahab_number: e.target.value })}
                                className="bg-slate-950 border-slate-800 rounded-xl text-xs text-white"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl py-6 text-xs gap-2"
                    >
                        <Save className="h-4 w-4" /> {saving ? "Kaydinayaa..." : "Kaydi Settings-ka"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
