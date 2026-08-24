"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Store } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { StoresSubNav } from "@/components/admin/admin-nav-links";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/loading-skeleton";
import { toast } from "sonner";

export default function AdminAllStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stores")
      .select("*")
      .order("name")
      .limit(80);
    setStores((data as Store[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    setStores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_approved: true } : s))
    );
    const { error } = await supabase
      .from("stores")
      .update({ is_approved: true })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    } else toast.success("Store approved");
  };

  return (
    <div>
      <PageHeader
        title="All stores"
        description="Ugu badnaan 80 dukaan"
        action={
          <Link href="/admin/stores/new">
            <Button>
              <Plus className="h-4 w-4" />
              Register Store
            </Button>
          </Link>
        }
      />
      <StoresSubNav />
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stores.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex gap-4 p-6">
                {s.logo && (
                  <img
                    src={s.logo}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{s.name}</h3>
                    <Badge variant={s.is_approved ? "success" : "warning"}>
                      {s.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {s.description || "—"}
                  </p>
                  {!s.is_approved && (
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => approve(s.id)}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
