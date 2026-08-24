"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Category } from "@/lib/types";
import { useSellerStore } from "@/hooks/use-seller-store";
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
import { MultiImageUpload } from "@/components/multi-image-upload";
import { Video } from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();
  const { store, loading: storeLoading } = useSellerStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    stock: "0",
    video_url: "",
  });

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) {
      toast.error("Ma jiro dukaan ku xiran akoonkaaga");
      return;
    }
    if (images.length === 0) {
      toast.error("Fadlan soo gali sawirka alaabta (ugu yaraan mid)");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("products").insert({
      id: generateId(),
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      image: images[0],
      images: images,
      video_url: form.video_url || null,
      category_id: form.category_id,
      store_id: store.id,
      store_name: store.name,
      stock: parseInt(form.stock, 10) || 0,
      is_approved: false, // sellers products need approval
      rating: 0,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Alaabta waa lagu daray, waxay sugaysaa ogolaansho");
      router.push("/seller/products");
    }
  };

  if (storeLoading) return null;

  if (!store) {
    return (
      <p className="text-slate-500 p-6 text-center">Xiriir la samee admin si loo habeeyo dukaankaaga.</p>
    );
  }

  return (
    <div className="pb-10">
      <PageHeader title="Ku dar Alaab Cusub" description={store.name} />
      <div className="max-w-4xl grid gap-6 md:grid-cols-2 mt-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <MultiImageUpload
              values={images}
              onChange={setImages}
              bucket="images"
            />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="w-4 h-4 text-slate-500" />
                Video URL <span className="text-xs font-normal text-slate-400 ml-1">(optional)</span>
              </Label>
              <Input
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder="https://youtube.com/... or direct/Supabase URL"
              />
              <p className="text-xs text-slate-400">
                YouTube link or direct MP4 link.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Magaca Alaabta</Label>
                <Input
                  placeholder="Tusaale: Shaadh Cad"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Faahfaahin</Label>
                <Textarea
                  placeholder="Ka sheekee alaabtan..."
                  className="min-h-[100px]"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Qiimaha ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tirada Stock-ka</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Qaybta (Category)</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm({ ...form, category_id: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Dooro category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting ? "Libaaxay..." : "Ku dar Alaabta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
