"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminPaymentsPage() {
  const [evc, setEvc] = useState("");
  const [edahab, setEdahab] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("*")
      .in("key", ["admin_evc", "admin_edahab"]);
    (data ?? []).forEach((s: { key: string; value: string }) => {
      if (s.key === "admin_evc") setEvc(s.value);
      if (s.key === "admin_edahab") setEdahab(s.value);
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (key: string, value: string) => {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      save("admin_evc", evc),
      save("admin_edahab", edahab),
    ]);
    setSaving(false);
  };

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Admin EVC Plus and eDahab numbers"
      />
      <Card className="max-w-md">
        <CardContent className="space-y-4 p-6">
          {loading ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Admin EVC Plus</Label>
                <Input value={evc} onChange={(e) => setEvc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Admin eDahab</Label>
                <Input
                  value={edahab}
                  onChange={(e) => setEdahab(e.target.value)}
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
