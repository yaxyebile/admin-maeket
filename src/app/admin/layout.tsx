"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { adminNavItems } from "@/components/admin-nav";
import { RealtimeNotifier } from "@/components/realtime-notifier";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRole="admin">
      <RealtimeNotifier />
      <div className="flex min-h-screen bg-background">
        <Sidebar items={adminNavItems} title="Admin Dashboard" />
        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </AuthGuard>
  );
}

