"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getWaafiSettings,
  saveWaafiSettings,
  DEFAULT_WAAFI_SETTINGS,
} from "@/lib/waafi-pay";
import { CreditCard, Zap, Info, CheckCircle2 } from "lucide-react";

export default function AdminPaymentsPage() {
  // WAAFI Pay state
  const [merchantUid, setMerchantUid] = useState(DEFAULT_WAAFI_SETTINGS.merchantUid);
  const [apiUserId, setApiUserId] = useState(DEFAULT_WAAFI_SETTINGS.apiUserId);
  const [apiKey, setApiKey] = useState(DEFAULT_WAAFI_SETTINGS.apiKey);
  const [autoSwitch, setAutoSwitch] = useState(true);

  // Manual payment numbers
  const [evc, setEvc] = useState("");
  const [edahab, setEdahab] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // Load WAAFI Pay settings
    const waafi = await getWaafiSettings();
    setMerchantUid(waafi.merchantUid);
    setApiUserId(waafi.apiUserId);
    setApiKey(waafi.apiKey);
    setAutoSwitch(waafi.autoSwitch);

    // Load manual EVC & eDahab
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save WAAFI settings
      const waafiOk = await saveWaafiSettings({
        merchantUid,
        apiUserId,
        apiKey,
        autoSwitch,
      });

      // Save Manual Settings
      await Promise.all([
        supabase.from("app_settings").upsert({ key: "admin_evc", value: evc }, { onConflict: "key" }),
        supabase.from("app_settings").upsert({ key: "admin_edahab", value: edahab }, { onConflict: "key" }),
      ]);

      if (waafiOk) {
        toast.success("WAAFI Pay & Payment settings saved successfully!");
      } else {
        toast.error("Failed to save some settings.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Gateway Settings"
        description="Maamul fureyaasha WAAFI Pay API, Automatic EVC Switch, iyo Nambarada Lacag Bixinta"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* WAAFI Pay Configuration Card */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="bg-slate-50/50 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">WAAFI Pay API Configuration</CardTitle>
                  <CardDescription className="text-xs">Automatic EVC Plus Payment Integration</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Auto EVC</span>
                <Switch
                  checked={autoSwitch}
                  onCheckedChange={setAutoSwitch}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Merchant UID</Label>
                  <Input
                    value={merchantUid}
                    placeholder="M0914437"
                    onChange={(e) => setMerchantUid(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">API User ID</Label>
                  <Input
                    value={apiUserId}
                    placeholder="1009283"
                    onChange={(e) => setApiUserId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">API Key</Label>
                  <Input
                    type="password"
                    value={apiKey}
                    placeholder="API-I25284gnwZ7uKRBVLjsBq5JBJ"
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 flex gap-2">
                  <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Simulation Mode Note:</span> Haddii fureyaasha faaruq laga dhigo ama Automatic EVC Switch-ka la damiyo, app-ku wuxuu si toos ah u isticmaalayaa <strong>Simulation Mode</strong> si loo tijaabiyo bixinta lacagta.
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Manual Payment Numbers Card */}
        <Card className="shadow-sm">
          <CardHeader className="bg-slate-50/50 pb-4 border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Manual Payment Numbers</CardTitle>
                <CardDescription className="text-xs">Nambarada Admin-ka EVC Plus iyo eDahab</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Admin EVC Plus Number</Label>
                  <Input
                    value={evc}
                    placeholder="61XXXXXXX"
                    onChange={(e) => setEvc(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Admin eDahab Number</Label>
                  <Input
                    value={edahab}
                    placeholder="62XXXXXXX"
                    onChange={(e) => setEdahab(e.target.value)}
                  />
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Marka macmiilku lacag bixiyo, dalabku wuxuu si automatic ah u noqonayaa <strong>isPaid: true</strong> iyo status-ka <strong>approved</strong>.</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="px-8 shadow-md">
          {saving ? "Keydinaya..." : "Save Payment Settings"}
        </Button>
      </div>
    </div>
  );
}
