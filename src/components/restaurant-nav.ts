import {
    Utensils,
    PlusCircle,
    Clock,
    Sparkles,
    Settings,
    DollarSign,
    PackageCheck,
    Tag,
} from "lucide-react";
import type { NavItem } from "@/components/sidebar";

export const restaurantNavItems: NavItem[] = [
    { href: "/restaurant", label: "Dashboard Hub", icon: Utensils },
    { href: "/restaurant/pos", label: "POS Terminal (Manual Order)", icon: PlusCircle },
    { href: "/restaurant/discounts", label: "Special Discounts", icon: Tag },
    { href: "/restaurant/menu", label: "Menu Items", icon: Sparkles },
    { href: "/restaurant/orders", label: "Live Orders Stream", icon: Clock },
    { href: "/delivery", label: "Delivery Drivers Pool", icon: PackageCheck },
    { href: "/restaurant/revenue", label: "Financial Revenue", icon: DollarSign },
    { href: "/restaurant/settings", label: "Maqaayada Settings", icon: Settings },
];
