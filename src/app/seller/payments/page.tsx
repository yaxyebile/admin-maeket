"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSellerStore } from "@/hooks/use-seller-store";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function SellerPaymentsPage() {
  const { store, loading: storeLoading, refresh } = useSellerStore();
  const [evc, setEvc] = useState("");
  const [edahab, setEdahab] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) {
      setEvc(store.evc_number ?? "");
      setEdahab(store.edahab_number ?? "");
    }
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({ evc_number: evc, edahab_number: edahab })
      .eq("id", store.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Payment numbers updated");
      refresh();
    }
  };

  if (storeLoading) {
    return (
      <Card className="max-w-md">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!store) {
    return (
      <p className="text-slate-500">Contact admin to set up your store.</p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Payment Numbers"
        description="EVC Plus and eDahab for your store"
      />
      <Card className="max-w-md">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label>EVC Plus Number</Label>
            <Input value={evc} onChange={(e) => setEvc(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>eDahab Number</Label>
            <Input value={edahab} onChange={(e) => setEdahab(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
