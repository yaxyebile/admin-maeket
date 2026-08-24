import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={cn("border-0", ORDER_STATUS_COLORS[status])}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
