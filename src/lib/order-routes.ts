import type { OrderStatus } from "@/lib/types";

export const ORDER_STATUS_SLUGS: {
  slug: string;
  status: OrderStatus | "all";
  label: string;
}[] = [
  { slug: "all", status: "all", label: "All" },
  { slug: "pending", status: "pending", label: "Pending" },
  {
    slug: "payment-confirmed",
    status: "paymentConfirmed",
    label: "Payment Confirmed",
  },
  { slug: "approved", status: "approved", label: "Approved" },
  {
    slug: "out-for-delivery",
    status: "outForDelivery",
    label: "Out for Delivery",
  },
  { slug: "delivered", status: "delivered", label: "Delivered" },
  { slug: "cancelled", status: "cancelled", label: "Cancelled" },
];

export function orderStatusFromSlug(
  slug: string
): OrderStatus | "all" | undefined {
  return ORDER_STATUS_SLUGS.find((s) => s.slug === slug)?.status;
}

export function orderSlugFromStatus(
  status: OrderStatus | "all"
): string {
  return (
    ORDER_STATUS_SLUGS.find((s) => s.status === status)?.slug ?? "all"
  );
}
