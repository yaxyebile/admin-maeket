"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import type { UserRole } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGuard({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole: UserRole;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== allowedRole) {
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "seller") router.replace("/seller");
      else router.replace("/login");
    }
  }, [user, loading, router, allowedRole, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== allowedRole) return null;

  return <>{children}</>;
}
