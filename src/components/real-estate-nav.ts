import { CalendarDays, Home } from "lucide-react";
import type { NavItem } from "@/components/sidebar";

export const realEstateNavItems: NavItem[] = [
  { href: "/real-estate", label: "Houses & Land", icon: Home },
  { href: "/real-estate/bookings", label: "Bookings", icon: CalendarDays },
];
