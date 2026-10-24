"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { secondHandNavItems } from "@/components/second-hand-nav";

export default function SecondHandLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRole="second_hand">
      <div className="flex min-h-screen bg-background">
        <Sidebar items={secondHandNavItems} title="Second-Hand Management" />
        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
