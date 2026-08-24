import type { Order, OrderItem, PaymentMethod } from "./types";
import { generateId } from "./utils";
import { getStoreIdsFromItems, subtotalForItems } from "./order-split";

/** Isku xir dalabaadyada app-ku kala abuuray isku checkout */
export function checkoutFingerprint(order: Order): string {
  const d = new Date(order.date);
  const bucket = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}-${d.getUTCMinutes()}`;
  const phone = (order.customer_phone ?? "").trim();
  const name = (order.customer_name ?? "").trim().toLowerCase();
  const addr = (order.customer_address ?? "").trim().toLowerCase();
  return `${phone}|${name}|${addr}|${bucket}`;
}

/** Kooxo pending ah oo isku macmiil + isku daqiiqad — waa in la isku daraa */
export function findSplitCheckoutGroups(orders: Order[]): Order[][] {
  const pending = orders.filter((o) => o.status === "pending");
  const map = new Map<string, Order[]>();

  for (const o of pending) {
    const key = checkoutFingerprint(o);
    const list = map.get(key) ?? [];
    list.push(o);
    map.set(key, list);
  }

  return [...map.values()].filter((g) => g.length > 1);
}

export function mergeOrdersPayload(orders: Order[]): {
  primaryId: string;
  update: Pick<Order, "items" | "total_amount" | "store_id">;
  cancelIds: string[];
} {
  const sorted = [...orders].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const primary = sorted[0];
  const allItems: OrderItem[] = sorted.flatMap((o) =>
    Array.isArray(o.items) ? o.items : []
  );
  const storeIds = getStoreIdsFromItems(allItems);

  return {
    primaryId: primary.id,
    update: {
      items: allItems,
      total_amount: subtotalForItems(allItems),
      store_id: storeIds[0] ?? primary.store_id,
    },
    cancelIds: sorted.slice(1).map((o) => o.id),
  };
}

/**
 * Mobile / checkout — HAL order kaliya. Ha loop-garin dukaan kasta.
 */
export function buildSingleCheckoutOrder(input: {
  user_id: string;
  items: OrderItem[];
  payment_method: PaymentMethod;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
}): Omit<Order, "picked_up_at" | "delivered_at"> {
  const items = input.items;
  const storeIds = getStoreIdsFromItems(items);

  return {
    id: generateId(),
    user_id: input.user_id,
    items,
    total_amount: subtotalForItems(items),
    date: new Date().toISOString(),
    status: "pending",
    store_id: storeIds[0] ?? items[0]?.storeId ?? "",
    payment_method: input.payment_method,
    is_paid: false,
    delivery_person_id: null,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    customer_address: input.customer_address,
  };
}
