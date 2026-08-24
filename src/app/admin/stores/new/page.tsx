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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterStorePage() {
  const router = useRouter();
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [submitting, setSubmitting] = useState(false);
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
      .eq("role", "seller")
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
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Store registered");
      router.push("/admin/stores");
    }
  };

  return (
    <div>
      <PageHeader title="Register Store" description="Create a new store" />
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Banner URL</Label>
                <Input
                  value={form.banner}
                  onChange={(e) =>
                    setForm({ ...form, banner: e.target.value })
                  }
                />
              </div>
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
              <Label>Owner (Seller)</Label>
              <Select
                value={form.owner_id}
                onValueChange={(v) => setForm({ ...form, owner_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select seller" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.email})
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Register Store"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
