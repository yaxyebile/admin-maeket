import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "./useAuthStore";
import {
    LayoutDashboard,
    Users,
    Store,
    Package,
    ShoppingBag,
    Tags,
    Home,
    Calendar,
    Wrench,
    Truck,
    Image,
    CreditCard,
    Bell,
    LogOut,
    Menu,
    X,
    User,
    Activity
} from "lucide-react";

interface SidebarItem {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: ("admin" | "staff")[];
}

export default function Layout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navigationItems: SidebarItem[] = [
        // Super admin only
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin"] },
        { name: "Users Management", path: "/users", icon: Users, roles: ["admin"] },
        { name: "Stores Management", path: "/stores", icon: Store, roles: ["admin"] },
        { name: "Second Hand Items", path: "/second-hand", icon: Tags, roles: ["admin"] },
        { name: "Properties Listings", path: "/properties", icon: Home, roles: ["admin"] },
        { name: "Property Bookings", path: "/property-bookings", icon: Calendar, roles: ["admin"] },
        { name: "Second Hand Bookings", path: "/second-hand-bookings", icon: Calendar, roles: ["admin"] },
        { name: "Technicians", path: "/technicians", icon: Wrench, roles: ["admin"] },
        { name: "Technician Bookings", path: "/technician-bookings", icon: Calendar, roles: ["admin"] },
        { name: "Cargo Ads", path: "/cargo", icon: Truck, roles: ["admin"] },
        { name: "Promos & Banners", path: "/promos", icon: Image, roles: ["admin"] },
        { name: "Revenue Reports", path: "/revenue", icon: CreditCard, roles: ["admin"] },
        { name: "Broadcast Notifications", path: "/notifications", icon: Bell, roles: ["admin"] },

        // Store manager only tasks
        { name: "Store Overview", path: "/store", icon: LayoutDashboard, roles: ["staff"] },

        // Shared functionality (different views)
        { name: "Products", path: user?.role === "admin" ? "/products" : "/store/products", icon: Package, roles: ["admin", "staff"] },
        { name: "Orders", path: user?.role === "admin" ? "/orders" : "/store/orders", icon: ShoppingBag, roles: ["admin", "staff"] },
    ];

    const filteredItems = navigationItems.filter(item =>
        user && item.roles.includes(user.role as any)
    );

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const currentItem = navigationItems.find(item => item.path === location.pathname);

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex md:w-64 flex-col bg-slate-900 border-r border-slate-800 shrink-0">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <Activity className="h-6 w-6 text-emerald-500 animate-pulse" />
                    <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        EMARA Admin
                    </span>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Card */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-slate-800/40">
                        <div className="w-10 h-10 rounded-full bg-slate-700 font-bold text-slate-200 flex items-center justify-center uppercase border border-slate-600 select-none">
                            {user?.name?.substring(0, 2) || "AD"}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <h4 className="text-xs font-semibold truncate text-white">{user?.name}</h4>
                            <p className="text-[10px] text-slate-400 capitalize bg-slate-800 rounded px-1.5 py-0.5 inline-block mt-0.5 border border-slate-700/50">
                                {user?.role === "admin" ? "Super Admin" : "Store Staff"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-slate-850 hover:bg-red-950/40 hover:text-red-400 text-slate-400 border border-slate-800 hover:border-red-900/30 transition-all cursor-pointer"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Container */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
                    {/* Mobile menu trigger */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="hidden md:block">
                        <h1 className="text-lg font-bold text-white tracking-tight">
                            {currentItem ? currentItem.name : "EMARA Admin Console"}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <span className="text-sm text-slate-400">Authenticated as </span>
                            <span className="text-sm font-semibold text-emerald-400">{user?.email}</span>
                        </div>
                        {/* Simple notification bell icon */}
                        <button className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        </button>
                    </div>
                </header>

                {/* Client Area */}
                <main className="flex-1 overflow-auto bg-slate-950">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="relative flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-200">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-emerald-500" />
                                <span className="text-md font-bold text-white">EMARA Mobile</span>
                            </div>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                            {filteredItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                                ? "bg-emerald-600 text-white"
                                                : "text-slate-450 hover:bg-slate-805 hover:text-white"
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="p-4 border-t border-slate-800">
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold bg-red-950/20 text-red-500 rounded-md border border-red-950 hover:bg-red-950/40 transition-all cursor-pointer"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
