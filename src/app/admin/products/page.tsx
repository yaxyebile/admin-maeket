"use client";

import { useEffect, useState } from "react";
import { Package, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { SectionHubCard } from "@/components/admin/section-hub-card";
import { ProductsSubNav } from "@/components/admin/admin-nav-links";
import { CardGridSkeleton } from "@/components/loading-skeleton";

export default function AdminProductsHubPage() {
  const [pending, setPending] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_approved", false),
      supabase.from("products").select("id", { count: "exact", head: true }),
    ]).then(([p, t]) => {
      setPending(p.count ?? 0);
      setTotal(t.count ?? 0);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader
        title="Products"
        description="Bogag gaar ah — ma aha hal liis culus"
      />
      <ProductsSubNav />
      {loading ? (
        <CardGridSkeleton count={3} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          <SectionHubCard
            href="/admin/products/pending"
            title="Pending approval"
            count={pending}
            icon={Package}
            accent="bg-amber-100 text-amber-700"
          />
          <SectionHubCard
            href="/admin/products/all"
            title="All products"
            count={total}
            icon={Package}
          />
          <SectionHubCard
            href="/admin/products/new"
            title="Add product"
            icon={Plus}
            accent="bg-emerald-100 text-emerald-700"
          />
        </div>
      )}
    </div>
  );
}
