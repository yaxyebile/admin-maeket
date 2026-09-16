import type { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Phone, User, CreditCard, Store } from "lucide-react";

interface OrderCustomerPanelProps {
  order: Order;
  storeLabel?: string;
  totalLabel?: string;
  totalAmount: number;
}

export function OrderCustomerPanel({
  order,
  storeLabel,
  totalLabel = "Wadarta",
  totalAmount,
}: OrderCustomerPanelProps) {
  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-white p-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">
        Macmiilka & dalabka — hal meel
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 sm:col-span-2">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              {order.customer_name ?? "—"}
            </p>
            <p className="text-xs text-slate-500">Magaca macmiilka</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{order.customer_phone ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4 shrink-0 text-slate-400" />
          <span>
            {order.payment_method}
            {order.is_paid && (
              <span className="ml-2 font-semibold text-accent">· Lacag bixintay</span>
            )}
          </span>
        </div>
        <div className="flex items-start gap-2 text-sm sm:col-span-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>
            {(() => {
              const rawFulfillment = String(
                order.fulfillment_type ||
                (order as any).delivery_type ||
                (order as any).shipping_method ||
                ""
              ).toLowerCase();
              const isPickup =
                rawFulfillment === "pickup" ||
                rawFulfillment.includes("iska soo doono") ||
                rawFulfillment.includes("pick") ||
                (order as any).is_pickup === true;

              return isPickup
                ? "🚶‍♂️ PICKUP (Macmiilka iska soo doonaya dukaanka)"
                : order.customer_address || "—";
            })()}
          </span>
        </div>
        {storeLabel && (
          <div className="flex items-start gap-2 text-sm sm:col-span-2">
            <Store className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{storeLabel}</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-primary/10 pt-4">
        <span className="text-sm font-medium text-slate-600">{totalLabel}</span>
        <span className="text-2xl font-bold text-primary">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}
