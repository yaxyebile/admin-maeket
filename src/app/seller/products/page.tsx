"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Images,
  Video,
  Play,
  Edit2,
  Trash2,
  RefreshCw,
  Package,
  AlertTriangle,
  Search,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product, Category } from "@/lib/types";
import { useSellerStore } from "@/hooks/use-seller-store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/loading-skeleton";
import { MediaPreviewModal } from "@/components/media-preview-modal";
import { MultiImageUpload } from "@/components/multi-image-upload";
import { toast } from "sonner";

export default function SellerProductsPage() {
  const { store, loading: storeLoading } = useSellerStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "out" | "in">("all");

  // Edit Product Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    original_price: "",
    category_id: "",
    stock: "0",
    video_url: "",
  });

  // Quick Restock Dialog State
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState("50");
  const [restockSubmitting, setRestockSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!store) {
      setLoading(false);
      return;
    }
    const [prodRes, catRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .order("name"),
      supabase.from("categories").select("*"),
    ]);

    setProducts((prodRes.data as Product[]) ?? []);
    setCategories((catRes.data as Category[]) ?? []);
    setLoading(false);
  }, [store]);

  useEffect(() => {
    if (!storeLoading) load();
  }, [load, storeLoading]);

  // Open Edit Modal
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name,
      description: p.description || "",
      price: p.price.toString(),
      original_price: p.original_price ? p.original_price.toString() : "",
      category_id: p.category_id || "",
      stock: p.stock.toString(),
      video_url: p.video_url || "",
    });
    setEditImages(p.images?.length ? p.images : p.image ? [p.image] : []);
    setEditModalOpen(true);
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (editImages.length === 0) {
      toast.error("Fadlan geli ugu yaraan hal sawir");
      return;
    }

    setEditSubmitting(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: editForm.name,
          description: editForm.description,
          price: parseFloat(editForm.price) || 0,
          original_price: editForm.original_price ? parseFloat(editForm.original_price) : null,
          stock: parseInt(editForm.stock, 10) || 0,
          category_id: editForm.category_id,
          video_url: editForm.video_url || null,
          image: editImages[0],
          images: editImages,
        })
        .eq("id", editingProduct.id);

      if (error) {
        toast.error("Cilad ayaa dhacday: " + error.message);
      } else {
        toast.success("✅ Alaabta waa la cusbooneysiiyay (Successfully updated)!");
        setEditModalOpen(false);
        load();
      }
    } catch (err: any) {
      toast.error("Cilad ayaa dhacday: " + err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Open Quick Restock Modal
  const handleOpenRestockModal = (p: Product) => {
    setRestockProduct(p);
    setNewStockValue(p.stock > 0 ? p.stock.toString() : "50");
    setRestockModalOpen(true);
  };

  // Submit Quick Restock
  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;

    setRestockSubmitting(true);
    try {
      const addedStock = parseInt(newStockValue, 10) || 0;
      const { error } = await supabase
        .from("products")
        .update({ stock: addedStock })
        .eq("id", restockProduct.id);

      if (error) {
        toast.error("Cilad: " + error.message);
      } else {
        toast.success(`📦 Stock-ka alaabta "${restockProduct.name}" waxaa loo cusbooneysiiyay: ${addedStock}`);
        setRestockModalOpen(false);
        load();
      }
    } catch (err: any) {
      toast.error("Cilad ayaa dhacday: " + err.message);
    } finally {
      setRestockSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (pId: string, pName: string) => {
    if (!confirm(`Ma cinwaansan tahay inaad tirtirto alaabta: "${pName}"?`)) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", pId);
      if (error) toast.error("Cilad: " + error.message);
      else {
        toast.success("Alaabta waa la tirtiray");
        load();
      }
    } catch {
      toast.error("Cilad ayaa dhacday marka la tirtirayay");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStock = true;
    if (stockFilter === "out") matchesStock = p.stock <= 0;
    else if (stockFilter === "in") matchesStock = p.stock > 0;
    return matchesSearch && matchesStock;
  });

  if (!storeLoading && !store) {
    return (
      <p className="text-slate-500 p-6 text-center">Contact admin to set up your store.</p>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Alaabta Dukaanka (Products Management)"
        description="Maamul, wax ka baddal (Edit), oo ku dar Stock cusub alaabtaada dukaanka."
        action={
          store && (
            <Link href="/seller/products/new">
              <Button className="bg-[#00A8E8] hover:bg-[#0092CB] text-white font-extrabold rounded-xl shadow-sm gap-2">
                <Plus className="h-4 w-4 stroke-[3]" />
                + Ku dar Alaab Cusub
              </Button>
            </Link>
          )
        }
      />

      {/* Toolbar: Search & Stock Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Raadi alaabta magaceeda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-none focus-visible:ring-0 text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant={stockFilter === "all" ? "default" : "outline"}
            onClick={() => setStockFilter("all")}
            className="rounded-xl text-xs font-bold"
          >
            Dhammaan ({products.length})
          </Button>
          <Button
            size="sm"
            variant={stockFilter === "out" ? "destructive" : "outline"}
            onClick={() => setStockFilter("out")}
            className="rounded-xl text-xs font-bold gap-1"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Out of Stock ({products.filter((p) => p.stock <= 0).length})
          </Button>
          <Button
            size="sm"
            variant={stockFilter === "in" ? "secondary" : "outline"}
            onClick={() => setStockFilter("in")}
            className="rounded-xl text-xs font-bold"
          >
            In Stock ({products.filter((p) => p.stock > 0).length})
          </Button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center border-slate-200 bg-white rounded-2xl shadow-sm">
          <Package className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <p className="font-extrabold text-slate-700 text-base">Wax alaab ah ma jiro</p>
          <p className="text-xs text-slate-500 mt-1">
            Lama helin alaab waafaqsan raadintaada ama filter-kaaga.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => {
            const allImages = p.images?.length ? p.images : p.image ? [p.image] : [];
            const coverImage = allImages[0];
            const isOutOfStock = p.stock <= 0;

            return (
              <Card key={p.id} className="overflow-hidden hover:shadow-md transition-all flex flex-col justify-between border-slate-200">
                <div>
                  {coverImage && (
                    <div className="relative h-44 bg-slate-100 group overflow-hidden">
                      <img
                        src={coverImage}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* View Gallery Overlay */}
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
                      >
                        <Images className="w-4 h-4" /> View Gallery
                      </button>

                      {/* Stock Warning Overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-red-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-3 text-center">
                          <AlertTriangle className="h-8 w-8 text-amber-400 mb-1 animate-bounce" />
                          <span className="font-black text-xs uppercase tracking-wider bg-red-600 px-3 py-1 rounded-full">
                            ALAABTU WAA DHAMMAATAY
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleOpenRestockModal(p)}
                            className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md gap-1"
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Ku dar Stock Cusub
                          </Button>
                        </div>
                      )}

                      {allImages.length > 1 && (
                        <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full font-bold">
                          <Images className="w-3 h-3" /> {allImages.length}
                        </span>
                      )}
                      {p.video_url && (
                        <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] bg-purple-600/90 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                          <Play className="w-2.5 h-2.5 fill-current" /> Video
                        </span>
                      )}
                    </div>
                  )}

                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1">{p.name}</h3>
                      <Badge variant={p.is_approved ? "secondary" : "warning"} className="shrink-0 text-[10px]">
                        {p.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-[#00A8E8]">
                        {formatCurrency(p.price)}
                      </span>
                      {p.original_price && p.original_price > p.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(p.original_price)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className={`font-bold flex items-center gap-1 ${isOutOfStock ? "text-red-600 font-black" : "text-slate-600"}`}>
                        <Package className="h-3.5 w-3.5" /> Stock: <strong>{p.stock}</strong>
                      </span>

                      {isOutOfStock ? (
                        <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          In Stock
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Card Action Buttons (EDIT, RESTOCK, DELETE) */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenRestockModal(p)}
                    className="h-8 rounded-xl text-xs font-extrabold gap-1 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Restock
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleOpenEditModal(p)}
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl px-3 gap-1 shadow-sm"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Wax ka baddal (Edit)
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      className="h-8 w-8 p-0 rounded-xl text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Media Preview Gallery Modal */}
      {selectedProduct && (
        <MediaPreviewModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          images={selectedProduct.images?.length ? selectedProduct.images : selectedProduct.image ? [selectedProduct.image] : []}
          videoUrl={selectedProduct.video_url}
          title={selectedProduct.name}
        />
      )}

      {/* Full Edit Product Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-[#00A8E8]" />
              Wax ka baddal Alaabta (Edit Product Details)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Beddel magaca alaabta, qiimaha, tirada stock-ka, sawirrada, ama qaybta.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Magaca Alaabta</Label>
              <Input
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="rounded-xl text-sm font-semibold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Faahfaahinta Alaabta (Description)</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="rounded-xl text-xs min-h-[90px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#00A8E8]">Qiimaha Hada ($)</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="rounded-xl text-sm font-black"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500">Qiimihi Hore ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                  value={editForm.original_price}
                  onChange={(e) => setEditForm({ ...editForm, original_price: e.target.value })}
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-emerald-700">Tirada Stock-ka</Label>
                <Input
                  required
                  type="number"
                  value={editForm.stock}
                  onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  className="rounded-xl text-sm font-bold bg-emerald-50/50 border-emerald-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Qaybta (Category)</Label>
              <Select
                value={editForm.category_id}
                onValueChange={(v) => setEditForm({ ...editForm, category_id: v })}
              >
                <SelectTrigger className="rounded-xl text-sm font-medium">
                  <SelectValue placeholder="Dooro Category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Video Link (YouTube / MP4)</Label>
              <Input
                placeholder="https://..."
                value={editForm.video_url}
                onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Sawirrada Alaabta</Label>
              <MultiImageUpload
                values={editImages}
                onChange={setEditImages}
                bucket="images"
              />
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="rounded-xl font-bold text-xs"
              >
                Kansal
              </Button>
              <Button
                type="submit"
                disabled={editSubmitting}
                className="bg-[#00A8E8] hover:bg-[#0092CB] text-white font-extrabold rounded-xl text-xs px-6 shadow-md"
              >
                {editSubmitting ? "Waa la kaydinayaa..." : "Kaydi Badalaada (Save Changes)"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Restock Dialog */}
      <Dialog open={restockModalOpen} onOpenChange={setRestockModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-emerald-600" />
              Cusbooneysii Stock-ka Alaabta (Restock)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Alaabta: <strong>{restockProduct?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRestock} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Geli Tirada Stock-ka Cusub</Label>
              <Input
                type="number"
                min="0"
                required
                value={newStockValue}
                onChange={(e) => setNewStockValue(e.target.value)}
                className="rounded-xl text-lg font-black text-center text-emerald-700 bg-emerald-50 border-emerald-300"
              />
              <p className="text-[11px] text-slate-500 text-center">
                Stock-ga alaabtan hadda waa: <strong>{restockProduct?.stock || 0}</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRestockModalOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Kansal
              </Button>
              <Button
                type="submit"
                disabled={restockSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl px-5 gap-1 shadow-md"
              >
                {restockSubmitting ? "Updating..." : "✅ Kaydi Stock-ka Cusub"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
