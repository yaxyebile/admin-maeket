"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ORDER_STATUS_SLUGS } from "@/lib/order-routes";
import { cn } from "@/lib/utils";

interface AdminSubNavProps {
  basePath: string;
  items: { slug: string; label: string; overview?: boolean }[];
}

export function AdminSubNav({ basePath, items }: AdminSubNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const href = item.overview ? basePath : `${basePath}/${item.slug}`;
        const active = item.overview
          ? pathname === basePath
          : pathname === href;
        return (
          <Link
            key={item.slug}
            href={href}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function OrdersSubNav() {
  return (
    <AdminSubNav
      basePath="/admin/orders"
      items={[
        { slug: "", label: "Overview", overview: true },
        ...ORDER_STATUS_SLUGS.filter((s) => s.slug !== "all").map((s) => ({
          slug: s.slug,
          label: s.label,
        })),
        { slug: "all", label: "All orders" },
      ]}
    />
  );
}

export function ProductsSubNav() {
  const pathname = usePathname();
  const links = [
    { href: "/admin/products", label: "Overview", exact: true },
    { href: "/admin/categories", label: "Qaybaha (Categories)" },
    { href: "/admin/products/pending", label: "Pending" },
    { href: "/admin/products/all", label: "All" },
    { href: "/admin/products/new", label: "Add New" },
  ];
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {links.map((l) => {
        const active = l.exact
          ? pathname === l.href
          : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StoresSubNav() {
  const pathname = usePathname();
  const links = [
    { href: "/admin/stores", label: "Overview", exact: true },
    { href: "/admin/stores/pending", label: "Pending" },
    { href: "/admin/stores/all", label: "All" },
    { href: "/admin/stores/performance", label: "Performance" },
  ];
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {links.map((l) => {
        const active = l.exact
          ? pathname === l.href
          : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
