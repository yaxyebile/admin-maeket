"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PromoBanner } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableSkeleton } from "@/components/loading-skeleton";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

const emptyForm = {
  image_url: "",
  title: "",
  tag: "",
  btn_text: "Shop Now",
  color_hex: "#FF6B00",
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PromoBanner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("promo_banners").select("*");
    setPromos((data as PromoBanner[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.title || !form.image_url) {
      toast.error("Title and image URL required");
      return;
    }
    if (editing) {
      const { error } = await supabase
        .from("promo_banners")
        .update(form)
        .eq("id", editing.id);
      if (error) toast.error(error.message);
      else {
        toast.success("Promo updated");
        resetForm();
        load();
      }
    } else {
      const { error } = await supabase.from("promo_banners").insert({
        id: generateId(),
        ...form,
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Promo created");
        resetForm();
        load();
      }
    }
  };

  const remove = async (id: string) => {
    setPromos((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from("promo_banners").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    } else toast.success("Promo deleted");
  };

  const startEdit = (p: PromoBanner) => {
    setEditing(p);
    setForm({
      image_url: p.image_url,
      title: p.title,
      tag: p.tag,
      btn_text: p.btn_text,
      color_hex: p.color_hex,
    });
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="Promo Banners"
        description="Manage homepage promotions"
        action={
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Promo
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 max-w-xl">
          <CardContent className="space-y-4 p-6">
            <h3 className="font-semibold">
              {editing ? "Edit Promo" : "New Promo"}
            </h3>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={form.image_url}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tag</Label>
                <Input
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={form.btn_text}
                  onChange={(e) =>
                    setForm({ ...form, btn_text: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color Hex</Label>
              <Input
                value={form.color_hex}
                onChange={(e) =>
                  setForm({ ...form, color_hex: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={save}>Save</Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promos.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt=""
                    className="mb-3 h-28 w-full rounded-xl object-cover"
                  />
                )}
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-slate-500">{p.tag}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
