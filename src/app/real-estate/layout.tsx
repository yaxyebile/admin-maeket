"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { realEstateNavItems } from "@/components/real-estate-nav";

export default function RealEstateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRole="real_estate">
      <div className="flex min-h-screen bg-background">
        <Sidebar items={realEstateNavItems} title="Real Estate Management" />
        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
