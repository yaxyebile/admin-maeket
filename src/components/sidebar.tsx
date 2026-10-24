"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
}

export function Sidebar({ items, title }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      <div className="border-b border-slate-100 p-6">
        <Logo />
        <p className="mt-2 text-xs font-medium text-slate-400">{title}</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const exactOnly = new Set([
            "/admin",
            "/seller",
            "/admin/orders",
            "/admin/products",
            "/admin/stores",
            "/real-estate",
            "/second-hand",
          ]);
          const active = exactOnly.has(item.href)
            ? pathname === item.href
            : pathname === item.href ||
            pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                active
                  ? "bg-[#C4F4FF] text-[#0A1C28] shadow-sm border border-[#9DE6FF]"
                  : "text-slate-600 hover:bg-[#D2F7FF]/50 hover:text-[#0A1C28]"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 lg:hidden">
        <Logo compact />
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-100 bg-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {nav}
      </aside>
    </>
  );
}
