"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Clock,
  Store,
  Truck,
  ShoppingBag,
  Package,
  Users,
  Image,
  AlertCircle,
} from "lucide-react";
import { fetchDashboardStats } from "@/lib/admin-stats";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { SectionHubCard } from "@/components/admin/section-hub-card";
import { CardGridSkeleton } from "@/components/loading-skeleton";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    paidRevenue: 0,
    pendingOrders: 0,
    totalStores: 0,
    deliveryStaff: 0,
    pendingProducts: 0,
    pendingStores: 0,
  });

  useEffect(() => {
    fetchDashboardStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Mogadishu Market — overview (light)"
      />

      {loading ? (
        <CardGridSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Paid Revenue"
            value={formatCurrency(stats.paidRevenue)}
            icon={DollarSign}
            iconColor="bg-primary/10 text-primary"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={Clock}
            iconColor="bg-amber-100 text-amber-700"
          />
          <StatCard
            title="Total Stores"
            value={stats.totalStores}
            icon={Store}
            iconColor="bg-accent/10 text-accent"
          />
          <StatCard
            title="Delivery Staff"
            value={stats.deliveryStaff}
            icon={Truck}
            iconColor="bg-indigo-100 text-indigo-700"
          />
        </div>
      )}

      <h2 className="mb-4 mt-10 text-lg font-semibold">Quick links</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SectionHubCard
          href="/admin/orders/pending"
          title="Pending orders"
          count={loading ? undefined : stats.pendingOrders}
          icon={ShoppingBag}
        />
        <SectionHubCard
          href="/admin/products/pending"
          title="Pending products"
          count={loading ? undefined : stats.pendingProducts}
          icon={Package}
          accent="bg-amber-100 text-amber-700"
        />
        <SectionHubCard
          href="/admin/stores/pending"
          title="Pending stores"
          count={loading ? undefined : stats.pendingStores}
          icon={Store}
          accent="bg-amber-100 text-amber-700"
        />
        <SectionHubCard
          href="/admin/orders"
          title="All orders"
          description="Status pages"
          icon={ShoppingBag}
        />
        <SectionHubCard
          href="/admin/users/new"
          title="Register user"
          icon={Users}
        />
        <SectionHubCard
          href="/admin/stores/new"
          title="Register store"
          icon={Store}
        />
        <SectionHubCard
          href="/admin/promos"
          title="Promo banners"
          icon={Image}
        />
        <SectionHubCard
          href="/admin/revenue"
          title="Store revenue"
          icon={DollarSign}
        />
      </div>

      {!loading &&
        (stats.pendingProducts > 0 || stats.pendingStores > 0) && (
          <Link
            href="/admin/products/pending"
            className="mt-6 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            Waxaa sugaya ansixinta: {stats.pendingProducts} alaab,{" "}
            {stats.pendingStores} dukaan
          </Link>
        )}
    </div>
  );
}
