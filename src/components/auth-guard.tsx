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
  allowedRole: UserRole | UserRole[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAllowed = user
    ? Array.isArray(allowedRole)
      ? allowedRole.includes(user.role)
      : user.role === allowedRole
    : false;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isAllowed) {
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "restaurant") router.replace("/restaurant");
      else if (user.role === "seller") router.replace("/seller");
      else if (user.role === "delivery") router.replace("/delivery");
      else router.replace("/checkout");
    }
  }, [user, loading, router, isAllowed, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full bg-slate-800" />
          <Skeleton className="h-64 w-full bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!user || !isAllowed) return null;

  return <>{children}</>;
}
