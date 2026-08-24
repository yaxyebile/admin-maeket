"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  findSplitCheckoutGroups,
  mergeOrdersPayload,
} from "@/lib/order-merge";
import { storeNamesLabel } from "@/lib/order-split";
import type { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface MergeCheckoutBannerProps {
  orders: Order[];
  storeNames: Record<string, string>;
  onMerged: () => void;
}

export function MergeCheckoutBanner({
  orders,
  storeNames,
  onMerged,
}: MergeCheckoutBannerProps) {
  const groups = findSplitCheckoutGroups(orders);
  const [merging, setMerging] = useState<string | null>(null);

  if (groups.length === 0) return null;

  const mergeGroup = async (group: Order[]) => {
    const key = group.map((o) => o.id).join(",");
    setMerging(key);
    const { primaryId, update, cancelIds } = mergeOrdersPayload(group);

    const { error: upErr } = await supabase
      .from("orders")
      .update(update)
      .eq("id", primaryId);

    if (upErr) {
      toast.error(upErr.message);
      setMerging(null);
      return;
    }

    for (const id of cancelIds) {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    }

    toast.success(
      `Hal dalab: ${update.items.length} alaab, ${formatCurrency(update.total_amount)}`
    );
    setMerging(null);
    onMerged();
  };

  return (
    <div className="mb-6 space-y-3">
      {groups.map((group) => {
        const key = group.map((o) => o.id).join(",");
        const total = group.reduce((s, o) => s + Number(o.total_amount), 0);
        const names = group
          .map((o) => storeNamesLabel(o, storeNames))
          .join(" + ");

        return (
          <div
            key={key}
            className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Isku qaanad — {group.length} dalab kala duwan
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {group[0].customer_name} · {group[0].customer_phone}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {names} — wadarta hadda {formatCurrency(total)}
                </p>
              </div>
              <Button
                onClick={() => mergeGroup(group)}
                disabled={merging === key}
              >
                {merging === key
                  ? "Waa la isku darayaa…"
                  : "Isku dar hal dalab"}
              </Button>
            </div>
            <ul className="mt-3 space-y-1 border-t border-primary/10 pt-3 text-sm">
              {group.map((o) => (
                <li key={o.id} className="flex justify-between text-slate-600">
                  <span>
                    #{o.id.slice(0, 8)} — {storeNamesLabel(o, storeNames)}
                  </span>
                  <span>{formatCurrency(o.total_amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <p className="text-xs text-slate-500">
        App-ka mobile waa inuu abuuraa hal order marka checkout — ha kala
        abuurin dukaan kasta.
      </p>
    </div>
  );
}
