"use client";

import { AuthGuard } from "@/components/auth-guard";
import { RestaurantSidebar } from "@/components/restaurant-sidebar";
import { RealtimeNotifier } from "@/components/realtime-notifier";

export default function RestaurantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard allowedRole={["restaurant", "admin"]}>
            <RealtimeNotifier />
            <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
                <RestaurantSidebar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 text-slate-100">
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}
