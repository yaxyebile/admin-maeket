"use client";

import type { Order, Profile } from "@/lib/types";
import {
  getStoreIdsFromItems,
  groupItemsByStore,
  isMultiStoreOrder,
  itemsForStore,
  subtotalForItems,
} from "@/lib/order-split";
import { formatDate } from "@/lib/utils";
import { OrderCustomerPanel } from "@/components/order-customer-panel";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Truck, Store, AlertTriangle } from "lucide-react";

interface OrderCardProps {
  order: Order;
  storeName?: string;
  sellerStoreId?: string;
  deliveryStaff?: Profile[];
  selectedDelivery?: string;
  onDeliveryChange?: (id: string) => void;
  /** Hal confirm: seller + delivery */
  onConfirmOrder?: () => void;
  onApprove?: () => void;
  onApproveSellerOrder?: () => void;
  onCancel?: () => void;
  confirming?: boolean;
  readOnly?: boolean;
}

export function OrderCard({
  order,
  storeName,
  sellerStoreId,
  deliveryStaff = [],
  selectedDelivery,
  onDeliveryChange,
  onConfirmOrder,
  onApprove,
  onApproveSellerOrder,
  onCancel,
  confirming,
  readOnly,
}: OrderCardProps) {
  const allItems = Array.isArray(order.items) ? order.items : [];
  const items = sellerStoreId
    ? itemsForStore(order, sellerStoreId)
    : allItems;
  const multiStore = isMultiStoreOrder(order);
  const storeCount = getStoreIdsFromItems(allItems).length;
  const byStore = groupItemsByStore(allItems);
  const displayTotal = sellerStoreId
    ? subtotalForItems(items)
    : order.total_amount;

  const isAdminPending = !readOnly && !sellerStoreId && order.status === "pending";
  const isLegacyPaymentConfirmed =
    !readOnly && !sellerStoreId && order.status === "paymentConfirmed";

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-6 py-3">
          <div>
            <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
            <p className="text-xs text-slate-500">{formatDate(order.date)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {multiStore && (
              <Badge variant="secondary">{storeCount} dukaan</Badge>
            )}
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

              return isPickup ? (
                <Badge className="bg-emerald-600 text-white font-extrabold text-xs">
                  🚶‍♂️ PICKUP (ISKA SOO DOONO)
                </Badge>
              ) : (
                <Badge className="bg-blue-600 text-white font-bold text-xs">
                  🚚 GAARSIIN
                </Badge>
              );
            })()}
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <div className="space-y-4 px-6 pb-6">
          {/* Driver Cancellation Warning Banner for Admin */}
          {order.cancelled_by_driver_name && !sellerStoreId && (
            <div className="rounded-2xl border border-red-300 bg-red-50/90 p-4 space-y-3 shadow-xs">
              <div className="flex items-start gap-2.5 text-red-950 font-extrabold text-sm">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <p className="text-red-900 font-extrabold">
                    ⚠️ Wadaha &quot;{order.cancelled_by_driver_name}&quot; wuxuu kansalay/fasaxay gaarsiinta dalabkan.
                  </p>
                  <p className="text-xs text-red-700 font-medium mt-0.5">
                    Fadlan u xilsaar driver kale oo furan si alaabta loogu gaarsiiyo macmiilka.
                  </p>
                </div>
              </div>

              {onDeliveryChange && deliveryStaff.length > 0 && (
                <div className="pt-2 border-t border-red-200/80 space-y-2">
                  <p className="text-xs font-bold text-red-950 flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-red-600" />
                    Ku xilsaar Driver kale (Re-assign):
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {deliveryStaff.map((d) => (
                      <Button
                        key={d.id}
                        type="button"
                        size="sm"
                        variant={selectedDelivery === d.id ? "default" : "outline"}
                        className={`rounded-xl text-xs font-bold ${selectedDelivery === d.id
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-white border-red-200 text-slate-800 hover:bg-red-100"
                          }`}
                        onClick={() => onDeliveryChange(d.id)}
                      >
                        👨‍🔧 {d.name}
                      </Button>
                    ))}
                    {onApprove && selectedDelivery && (
                      <Button
                        size="sm"
                        onClick={onApprove}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Xaqiiji & U Dir Driver-kan
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!sellerStoreId ? (
            <OrderCustomerPanel
              order={order}
              storeLabel={storeName}
              totalAmount={Number(displayTotal)}
            />
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-slate-500">{order.customer_phone}</p>
              <p className="mt-2 font-semibold text-primary">
                Qaybtaada: {formatCurrency(displayTotal)}
              </p>
            </div>
          )}

          {sellerStoreId && multiStore && (
            <p className="text-sm text-slate-500">
              Dalab wadajir ah · {storeCount} dukaan · status: {order.status}
            </p>
          )}

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-2 text-xs font-medium uppercase text-slate-500">
              Alaabta
            </p>
            {multiStore && !sellerStoreId ? (
              <div className="space-y-3">
                {[...byStore.entries()].map(([sid, storeItems]) => (
                  <div key={sid}>
                    <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
                      <Store className="h-3 w-3" />
                      {storeItems[0]?.storeName ?? sid}
                    </p>
                    <ul className="space-y-1 text-sm">
                      {storeItems.map((item, i) => (
                        <li key={i} className="flex justify-between">
                          <span>
                            {item.productName} × {item.quantity}
                          </span>
                          <span>
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-1 text-sm">
                {items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isAdminPending && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">
                Xaqiiji hal mar — seller + delivery
              </p>
              <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                <span className="flex items-center gap-1">
                  <Store className="h-3.5 w-3.5 text-accent" />
                  Dhammaan seller-yada waa arki doonaan
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-primary" />
                  Delivery waa la qori doonaa
                </span>
              </div>

              {onDeliveryChange && deliveryStaff.length === 0 ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Ku dar delivery staff (Users → Delivery) ka hor intaadan
                  xaqiijin.
                </p>
              ) : onDeliveryChange && deliveryStaff.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600">
                    Dooro qofka delivery-ga
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {deliveryStaff.map((d) => (
                      <Button
                        key={d.id}
                        type="button"
                        size="sm"
                        variant={
                          selectedDelivery === d.id ? "default" : "outline"
                        }
                        onClick={() => onDeliveryChange(d.id)}
                      >
                        {d.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {onConfirmOrder && (
                  <Button
                    size="lg"
                    className="gap-2"
                    disabled={
                      confirming ||
                      (deliveryStaff.length > 0 && !selectedDelivery)
                    }
                    onClick={onConfirmOrder}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {confirming
                      ? "Waa la xaqiijinayaa…"
                      : "Xaqiiji dalabka"}
                  </Button>
                )}
                {onCancel && (
                  <Button size="lg" variant="destructive" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}

          {isLegacyPaymentConfirmed && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm text-slate-600">
                Lacagta waa la xaqiijiyay — u dir delivery
              </p>
              {onDeliveryChange && deliveryStaff.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {deliveryStaff.map((d) => (
                    <Button
                      key={d.id}
                      size="sm"
                      variant={
                        selectedDelivery === d.id ? "default" : "outline"
                      }
                      onClick={() => onDeliveryChange(d.id)}
                    >
                      {d.name}
                    </Button>
                  ))}
                </div>
              )}
              {onApprove && (
                <Button variant="secondary" onClick={onApprove}>
                  U dir delivery
                </Button>
              )}
            </div>
          )}

          {!readOnly &&
            !sellerStoreId &&
            order.status === "approved" && (
              <p className="flex items-center gap-2 text-sm text-accent">
                <CheckCircle2 className="h-4 w-4" />
                Seller-yada & delivery — waa la diray
                {order.delivery_person_id && deliveryStaff.length > 0 && (
                  <span className="text-foreground">
                    · {deliveryStaff.find((d) => d.id === order.delivery_person_id)?.name}
                  </span>
                )}
              </p>
            )}

          {sellerStoreId && (order.status === "paymentConfirmed" || order.status === "pending") && onApproveSellerOrder && (
            <div className="pt-2">
              <Button
                onClick={onApproveSellerOrder}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold gap-2 rounded-xl text-xs"
              >
                <CheckCircle2 className="h-4 w-4" /> ✅ Aqbal Dalabka (Approve Order & Start Preparing)
              </Button>
            </div>
          )}

          {sellerStoreId && order.status === "approved" && (
            <Badge className="w-fit bg-emerald-600/10 border border-emerald-500/30 text-emerald-700 font-bold">
              ✅ Dalabka waa la ansixiyay (Approved by Seller)
            </Badge>
          )}

          {!isAdminPending &&
            !isLegacyPaymentConfirmed &&
            !readOnly &&
            !sellerStoreId &&
            order.status !== "delivered" &&
            order.status !== "cancelled" &&
            order.status !== "approved" &&
            onCancel && (
              <Button size="sm" variant="destructive" onClick={onCancel}>
                Cancel
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
