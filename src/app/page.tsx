"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "admin") router.replace("/admin");
    else if (user.role === "seller") router.replace("/seller");
    else if (user.role === "restaurant") router.replace("/restaurant");
    else if (user.role === "delivery") router.replace("/delivery");
    else if (user.role === "real_estate") router.replace("/real-estate");
    else if (user.role === "second_hand") router.replace("/second-hand");
    else router.replace("/checkout");
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Skeleton className="h-12 w-48" />
    </div>
  );
}
