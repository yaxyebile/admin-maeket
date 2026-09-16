"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, LogOut, Menu, X, Utensils, Sparkles, Circle } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { restaurantNavItems } from "./restaurant-nav";

export function RestaurantSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [isOpenForOrders, setIsOpenForOrders] = useState(true);

    const nav = (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800">
            {/* Brand & Store Header */}
            <div className="p-6 border-b border-slate-800/80 bg-gradient-to-b from-rose-950/40 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white shadow-lg shadow-rose-600/30">
                        <Utensils className="h-6 w-6 stroke-[2.5]" />
                    </div>
                    <div>
                        <h2 className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                            RESTO POS
                            <span className="rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] px-2 py-0.5 font-extrabold uppercase">
                                PRO
                            </span>
                        </h2>
                        <p className="text-[11px] font-semibold text-rose-300/80">Restaurant Command Hub</p>
                    </div>
                </div>

                {/* Live Status Toggle Pill */}
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-800/80 border border-slate-700/60 p-3 shadow-inner">
                    <div className="flex items-center gap-2">
                        <Circle className={`h-2.5 w-2.5 fill-current ${isOpenForOrders ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
                        <span className="text-xs font-bold text-slate-200">
                            {isOpenForOrders ? "Maqaayadu waa Furan tahay" : "Waa Xiran tahay"}
                        </span>
                    </div>
                    <Switch
                        checked={isOpenForOrders}
                        onCheckedChange={setIsOpenForOrders}
                        className="data-[state=checked]:bg-emerald-500"
                    />
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
                <p className="px-3 text-[10px] font-black tracking-wider uppercase text-slate-500 mb-2">
                    Maamulka & Menu-ga
                </p>

                {restaurantNavItems.map((item) => {
                    const active = pathname === item.href || (item.href !== "/restaurant" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all relative group",
                                active
                                    ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-600/30 border border-rose-500/40"
                                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-white" : "text-rose-400")} />
                            <span className="flex-1 truncate">{item.label}</span>

                            {item.href === "/restaurant/pos" && (
                                <span className="rounded-full bg-rose-500/20 text-rose-300 text-[9px] px-2 py-0.5 font-black border border-rose-500/40">
                                    FAST
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Logout */}
            <div className="border-t border-slate-800/80 p-4 bg-slate-950/50">
                <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-800/50 border border-slate-800 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 font-black text-xs border border-rose-500/30">
                        {user?.name ? user.name.substring(0, 2).toUpperCase() : "RM"}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-100 truncate">{user?.name || "Restaurant Manager"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2.5 rounded-xl text-slate-400 hover:bg-rose-950/40 hover:text-rose-300 font-bold text-xs"
                    onClick={logout}
                >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    Kabax Akoonka (Logout)
                </Button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Top Header Bar */}
            <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 lg:hidden text-white">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white">
                        <Utensils className="h-4 w-4" />
                    </div>
                    <span className="font-extrabold text-sm text-white">RESTO POS</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="text-slate-300 hover:bg-slate-800">
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {open && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Desktop & Mobile Slideout Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform lg:static lg:translate-x-0",
                    open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {nav}
            </aside>
        </>
    );
}
