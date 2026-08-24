"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { sellerNavItems } from "@/components/seller-nav";
import { RealtimeNotifier } from "@/components/realtime-notifier";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRole="seller">
      <RealtimeNotifier />
      <div className="flex min-h-screen bg-background">
        <Sidebar items={sellerNavItems} title="Seller Dashboard" />
        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </AuthGuard>
  );
}

