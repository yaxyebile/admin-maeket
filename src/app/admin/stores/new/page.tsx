"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import { Utensils } from "lucide-react";

export default function RegisterStorePage() {
  const router = useRouter();
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [form, setForm] = useState({
    name: "",
    logo: "",
    banner: "",
    description: "",
    contact: "",
    owner_id: "",
    evc_number: "",
    edahab_number: "",
  });

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .in("role", ["seller", "restaurant", "admin"])
      .then(({ data }) => setSellers((data as Profile[]) ?? []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.owner_id) {
      toast.error("Select a seller owner");
      return;
    }
    setSubmitting(true);
    const id = generateId();
    const { error } = await supabase.from("stores").insert({
      id,
      name: form.name,
      logo: form.logo,
      banner: form.banner,
      description: form.description,
      contact: form.contact,
      owner_id: form.owner_id,
      evc_number: form.evc_number || null,
      edahab_number: form.edahab_number || null,
      is_approved: false,
      rating: 0,
      followers: 0,
      has_delivery: true,
      is_restaurant: isRestaurant,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Store registered successfully");
      router.push("/admin/stores");
    }
  };

  return (
    <div>
      <PageHeader title="Register Store" description="Create a new store or restaurant" />
      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Is Restaurant Switch */}
            <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <Label className="text-sm font-bold text-slate-900 cursor-pointer">
                    🍔 Dukaankani waa Maqaayad (Restaurant & Fast Food)
                  </Label>
                  <p className="text-xs text-slate-500">
                    Waxaa loo isticmaalayaa POS system-ka iyo menu-yada cuntada
                  </p>
                </div>
              </div>
              <Switch
                checked={isRestaurant}
                onCheckedChange={setIsRestaurant}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUpload
                label="Store Logo"
                value={form.logo}
                onChange={(url) => setForm({ ...form, logo: url })}
                bucket="logos"
              />
              <ImageUpload
                label="Store Banner"
                value={form.banner}
                onChange={(url) => setForm({ ...form, banner: url })}
                bucket="banners"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Owner (Seller / Restaurant Manager)</Label>
              <Select
                value={form.owner_id}
                onValueChange={(v) => setForm({ ...form, owner_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select seller/manager" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.email}) - {s.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>EVC Number</Label>
                <Input
                  value={form.evc_number}
                  onChange={(e) =>
                    setForm({ ...form, evc_number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>eDahab Number</Label>
                <Input
                  value={form.edahab_number}
                  onChange={(e) =>
                    setForm({ ...form, edahab_number: e.target.value })
                  }
                />
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-primary">
              {submitting ? "Creating..." : "Register Store / Restaurant"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
