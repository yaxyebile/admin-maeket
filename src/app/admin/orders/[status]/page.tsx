"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { orderStatusFromSlug } from "@/lib/order-routes";
import { PageHeader } from "@/components/page-header";
import { AdminOrdersList } from "@/components/admin/admin-orders-list";
import { OrdersSubNav } from "@/components/admin/admin-nav-links";
import { ORDER_STATUS_SLUGS } from "@/lib/order-routes";

export default function AdminOrdersStatusPage({
  params,
}: {
  params: Promise<{ status: string }>;
}) {
  const { status: slug } = use(params);
  const statusFilter = orderStatusFromSlug(slug);

  if (!statusFilter) {
    notFound();
  }

  const label =
    ORDER_STATUS_SLUGS.find((s) => s.slug === slug)?.label ?? slug;

  return (
    <div>
      <PageHeader title={label} description={`Dalabaadka: ${label}`} />
      <OrdersSubNav />
      <AdminOrdersList statusFilter={statusFilter} />
    </div>
  );
}
