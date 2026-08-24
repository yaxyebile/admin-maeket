"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ProductsSubNav } from "@/components/admin/admin-nav-links";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/loading-skeleton";
import { Images, Video, Play } from "lucide-react";
import { MediaPreviewModal } from "@/components/media-preview-modal";

export default function AdminAllProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, price, image, images, video_url, store_name, is_approved")
      .order("name")
      .limit(60);
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="All products" description="Ugu badnaan 60 — approved & pending" />
      <ProductsSubNav />
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const allImages = p.images?.length ? p.images : p.image ? [p.image] : [];
            const coverImage = allImages[0];

            return (
              <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Cover Image container */}
                {coverImage ? (
                  <div
                    onClick={() => setSelectedProduct(p)}
                    className="relative h-44 bg-slate-100 cursor-pointer group overflow-hidden"
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
                    {/* Photo count badge */}
                    {allImages.length > 1 && (
                      <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                        <Images className="w-3 h-3" /> {allImages.length} photos
                      </span>
                    )}
                    {/* Video badge */}
                    {p.video_url && (
                      <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] bg-purple-600/90 text-white px-2 py-0.5 rounded-full font-medium shadow-sm">
                        <Play className="w-2.5 h-2.5 fill-current" /> Video
                      </span>
                    )}
                  </div>
                ) : null}
                <CardContent className="p-4">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-semibold text-slate-800 line-clamp-1">{p.name}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.video_url && (
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="text-purple-600 hover:text-purple-700"
                          title="Watch video"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      )}
                      <Badge variant={p.is_approved ? "success" : "warning"}>
                        {p.is_approved ? "OK" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{p.store_name}</p>
                  <p className="mt-1 font-semibold text-primary">
                    {formatCurrency(p.price)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lightweight Media Preview Modal */}
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
