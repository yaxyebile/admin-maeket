"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Store } from "@/lib/types";
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

export default function RegisterUserPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "seller" as "seller" | "delivery",
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
    const { error } = await supabase.from("profiles").insert({
      id: generateId(),
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || null,
      role: form.role,
      store_id: form.role === "seller" && form.store_id ? form.store_id : null,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("User registered");
      router.push("/admin/users");
    }
  };

  return (
    <div>
      <PageHeader title="Register User" description="Add seller or delivery staff" />
      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm({ ...form, role: v as "seller" | "delivery" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === "seller" && (
              <div className="space-y-2">
                <Label>Store (optional)</Label>
                <Select
                  value={form.store_id}
                  onValueChange={(v) => setForm({ ...form, store_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link to store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Register User"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
