"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import {
  fetchAllOrdersCount,
  fetchOrderCountByStatus,
} from "@/lib/admin-stats";
import { ORDER_STATUS_SLUGS } from "@/lib/order-routes";
import { PageHeader } from "@/components/page-header";
import { SectionHubCard } from "@/components/admin/section-hub-card";
import { OrdersSubNav } from "@/components/admin/admin-nav-links";
import { CardGridSkeleton } from "@/components/loading-skeleton";

export default function AdminOrdersHubPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const all = await fetchAllOrdersCount();
      const entries = await Promise.all(
        ORDER_STATUS_SLUGS.filter((s) => s.status !== "all").map(
          async (s) => [s.slug, await fetchOrderCountByStatus(s.status as any)] as const
        )
      );
      setCounts({ all, ...Object.fromEntries(entries) });
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Dooro status — bog kasta wuxuu soo dejiyaa dalabaadkaas oo keliya"
      />
      <OrdersSubNav />

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ORDER_STATUS_SLUGS.map((s) => (
            <SectionHubCard
              key={s.slug}
              href={
                s.slug === "all"
                  ? "/admin/orders/all"
                  : `/admin/orders/${s.slug}`
              }
              title={s.label}
              count={counts[s.slug]}
              icon={ShoppingBag}
            />
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-slate-500">
        <Link href="/admin/orders/pending" className="text-primary font-medium">
          Pending orders →
        </Link>{" "}
        waa kan ugu culus — ka bilow halkaas.
      </p>
    </div>
  );
}
