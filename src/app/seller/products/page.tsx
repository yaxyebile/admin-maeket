"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Images, Video, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import { useSellerStore } from "@/hooks/use-seller-store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/loading-skeleton";
import { MediaPreviewModal } from "@/components/media-preview-modal";

export default function SellerProductsPage() {
  const { store, loading: storeLoading } = useSellerStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    if (!store) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("products")
      .select("id, name, price, stock, image, images, video_url, is_approved")
      .eq("store_id", store.id)
      .order("name");
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }, [store]);

  useEffect(() => {
    if (!storeLoading) load();
  }, [load, storeLoading]);

  if (!storeLoading && !store) {
    return (
      <p className="text-slate-500 p-6 text-center">Contact admin to set up your store.</p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Products"
        action={
          store && (
            <Link href="/seller/products/new">
              <Button>
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
          )
        }
      />
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const allImages = p.images?.length ? p.images : p.image ? [p.image] : [];
            const coverImage = allImages[0];

            return (
              <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {coverImage && (
                  <div
                    onClick={() => setSelectedProduct(p)}
                    className="relative h-40 bg-slate-100 cursor-pointer group overflow-hidden"
                  >
                    <img
                      src={coverImage}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                      View Gallery
                    </div>
                    {allImages.length > 1 && (
                      <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                        <Images className="w-3 h-3" /> {allImages.length} photos
                      </span>
                    )}
                    {p.video_url && (
                      <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] bg-purple-600/90 text-white px-2 py-0.5 rounded-full font-medium shadow-sm">
                        <Play className="w-2.5 h-2.5 fill-current" /> Video
                      </span>
                    )}
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-semibold text-slate-800 line-clamp-1">{p.name}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.video_url && (
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="text-purple-600 hover:text-purple-700 p-0.5"
                          title="Watch video"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      )}
                      <Badge variant={p.is_approved ? "success" : "warning"}>
                        {p.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-1 font-semibold text-primary">
                    {formatCurrency(p.price)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Stock: {p.stock}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedProduct && (
        <MediaPreviewModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          images={selectedProduct.images?.length ? selectedProduct.images : selectedProduct.image ? [selectedProduct.image] : []}
          videoUrl={selectedProduct.video_url}
          title={selectedProduct.name}
        />
      )}
    </div>
  );
}
