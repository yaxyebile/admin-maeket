import type { Order, OrderItem } from "./types";

/** Dukaamada ku jira hal dalab (hal order, dukaamo badan) */
export function getStoreIdsFromItems(items: OrderItem[]): string[] {
  return [...new Set(items.map((i) => i.storeId).filter(Boolean))];
}

export function isMultiStoreOrder(order: Order): boolean {
  return getStoreIdsFromItems(order.items).length > 1;
}

export function orderIncludesStore(order: Order, storeId: string): boolean {
  const items = Array.isArray(order.items) ? order.items : [];
  return items.some((i) => i.storeId === storeId);
}

export function filterOrdersForStore(
  orders: Order[],
  storeId: string
): Order[] {
  return orders.filter((o) => orderIncludesStore(o, storeId));
}

export function itemsForStore(order: Order, storeId: string): OrderItem[] {
  const items = Array.isArray(order.items) ? order.items : [];
  return items.filter((i) => i.storeId === storeId);
}

export function subtotalForItems(items: OrderItem[]): number {
  return items.reduce(
    (sum, i) => sum + Number(i.price) * Number(i.quantity),
    0
  );
}

export function storeSubtotalInOrder(order: Order, storeId: string): number {
  return subtotalForItems(itemsForStore(order, storeId));
}

export function groupItemsByStore(
  items: OrderItem[]
): Map<string, OrderItem[]> {
  const map = new Map<string, OrderItem[]>();
  for (const item of items) {
    const sid = item.storeId;
    if (!sid) continue;
    const list = map.get(sid) ?? [];
    list.push(item);
    map.set(sid, list);
  }
  return map;
}

export function storeNamesLabel(
  order: Order,
  storeNameMap?: Record<string, string>
): string {
  return getStoreIdsFromItems(order.items)
    .map(
      (id) =>
        storeNameMap?.[id] ??
        order.items.find((i) => i.storeId === id)?.storeName ??
        id
    )
    .join(" · ");
}

/** Revenue per store from paid orders (item subtotals, not full order total) */
export function revenueByStoreFromOrders(
  orders: Order[]
): Record<string, { revenue: number; count: number }> {
  const byStore: Record<string, { revenue: number; count: Set<string> }> = {};

  for (const order of orders) {
    if (!order.is_paid) continue;
    const seen = new Set<string>();
    for (const storeId of getStoreIdsFromItems(order.items)) {
      if (!byStore[storeId]) {
        byStore[storeId] = { revenue: 0, count: new Set() };
      }
      byStore[storeId].revenue += storeSubtotalInOrder(order, storeId);
      byStore[storeId].count.add(order.id);
      seen.add(storeId);
    }
  }

  const result: Record<string, { revenue: number; count: number }> = {};
  for (const [id, v] of Object.entries(byStore)) {
    result[id] = { revenue: v.revenue, count: v.count.size };
  }
  return result;
}
