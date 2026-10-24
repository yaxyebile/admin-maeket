import { CalendarDays, Tags } from "lucide-react";
import type { NavItem } from "@/components/sidebar";

export const secondHandNavItems: NavItem[] = [
  { href: "/second-hand", label: "Second-Hand Items", icon: Tags },
  { href: "/second-hand/bookings", label: "Bookings & Deposits", icon: CalendarDays },
];
