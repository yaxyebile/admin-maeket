"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Store, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { SectionHubCard } from "@/components/admin/section-hub-card";
import { StoresSubNav } from "@/components/admin/admin-nav-links";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/loading-skeleton";

export default function AdminStoresHubPage() {
  const [pending, setPending] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from("stores")
        .select("id", { count: "exact", head: true })
        .eq("is_approved", false),
      supabase.from("stores").select("id", { count: "exact", head: true }),
    ]).then(([p, t]) => {
      setPending(p.count ?? 0);
      setTotal(t.count ?? 0);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader
        title="Stores"
        description="Dukaamada — bogag kala duwan"
        action={
          <Link href="/admin/stores/new">
            <Button>
              <Plus className="h-4 w-4" />
              Register Store
            </Button>
          </Link>
        }
      />
      <StoresSubNav />
      {loading ? (
        <CardGridSkeleton count={3} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          <SectionHubCard
            href="/admin/stores/pending"
            title="Pending approval"
            count={pending}
            icon={Store}
            accent="bg-amber-100 text-amber-700"
          />
          <SectionHubCard
            href="/admin/stores/all"
            title="All stores"
            count={total}
            icon={Store}
          />
          <SectionHubCard
            href="/admin/stores/performance"
            title="Performance"
            icon={TrendingUp}
            accent="bg-blue-100 text-blue-700"
          />
        </div>
      )}
    </div>
  );
}
