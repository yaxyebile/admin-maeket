import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  PlusCircle,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import type { NavItem } from "@/components/sidebar";

export const sellerNavItems: NavItem[] = [
  { href: "/seller", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/orders", label: "Orders", icon: ShoppingBag },
  { href: "/seller/products/new", label: "Add Product", icon: PlusCircle },
  { href: "/seller/payments", label: "Payment Numbers", icon: CreditCard },
  { href: "/seller/chat", label: "Chat", icon: MessageSquare },
];
