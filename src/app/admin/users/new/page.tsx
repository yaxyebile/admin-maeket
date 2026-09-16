"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Store, UserRole } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Utensils, Store as StoreIcon, Truck, ShieldCheck } from "lucide-react";

export default function RegisterUserPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "restaurant" as UserRole,
    store_id: "",
  });

  useEffect(() => {
    supabase.from("stores").select("*").then(({ data }) => {
      setStores((data as Store[]) ?? []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const newUserId = generateId();
      let assignedStoreId = form.store_id || null;

      // Intelligent Auto-Creation: If Restaurant role registered without selecting store, create one automatically
      if (form.role === "restaurant" && !assignedStoreId) {
        const newStoreId = generateId();
        const { error: storeErr } = await supabase.from("stores").insert({
          id: newStoreId,
          name: `${form.name}'s Restaurant`,
          logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200",
          banner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
          description: "Cuntooyin macaan oo fesh ah (Fresh Food & Kitchen)",
          contact: form.phone || "615000000",
          rating: 4.8,
          followers: 120,
          is_approved: true,
          owner_id: newUserId,
          has_delivery: true,
          is_restaurant: true,
        });

        if (storeErr) {
          console.warn("Store auto creation notice:", storeErr.message);
        } else {
          assignedStoreId = newStoreId;
        }
      } else if (assignedStoreId) {
        // If an existing store was selected, update its owner_id to newUserId for explicit ownership
        await supabase.from("stores").update({ owner_id: newUserId }).eq("id", assignedStoreId);
      }

      // Insert User Profile
      const { error: profileErr } = await supabase.from("profiles").insert({
        id: newUserId,
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || null,
        role: form.role,
        store_id: assignedStoreId,
      });

      if (profileErr) {
        toast.error(profileErr.message);
      } else {
        toast.success(
          `✅ Account-ka ${form.name} (${form.role.toUpperCase()}) waa la abuuray! Akoonkiisa wuu diyaar u yahay login.`
        );
        router.push("/admin/users");
      }
    } catch {
      toast.error("Cillad ayaa dhacday marka la samaynayay akoonka");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Register User Account"
        description="Add Restaurant Manager, Seller, Delivery Driver, or Admin account"
      />
      <Card className="max-w-2xl rounded-3xl shadow-sm border-slate-200">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User Role Selection Pills */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Select User Role (Nooca Akoonka)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "restaurant" })}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-xs font-bold ${form.role === "restaurant"
                      ? "border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-600/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <Utensils className="h-5 w-5 mb-1" />
                  Maqaayad (Restaurant)
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "seller" })}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-xs font-bold ${form.role === "seller"
                      ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <StoreIcon className="h-5 w-5 mb-1" />
                  Dukaan (Seller)
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "delivery" })}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-xs font-bold ${form.role === "delivery"
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <Truck className="h-5 w-5 mb-1" />
                  Delivery Driver
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "admin" })}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-xs font-bold ${form.role === "admin"
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <ShieldCheck className="h-5 w-5 mb-1" />
                  Admin
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Full Name (Magaca Dhammaystiran)</Label>
              <Input
                required
                placeholder="E.g. Hassan Restaurant Manager"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Email Address</Label>
                <Input
                  type="email"
                  required
                  placeholder="manager@restaurant.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Phone Number (Optional)</Label>
                <Input
                  placeholder="615XXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Password</Label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-xl"
              />
            </div>

            {/* Store / Restaurant Assignment Dropdown */}
            {(form.role === "seller" || form.role === "restaurant") && (
              <div className="space-y-2">
                <Label className="text-xs font-bold">
                  {form.role === "restaurant"
                    ? "Link to Existing Restaurant (Ama leaves blank for auto creation)"
                    : "Link to Seller Store"}
                </Label>
                <Select value={form.store_id} onValueChange={(v) => setForm({ ...form, store_id: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Dooro Dukaanka ama Maqaayada (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.is_restaurant ? "🍔 (Restaurant)" : "🛍 (Store)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className={`w-full font-bold rounded-2xl py-6 text-sm ${form.role === "restaurant" ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-primary"
                }`}
            >
              {submitting ? "Creating User Account..." : "Create User Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
