"use client";

import { PageHeader } from "@/components/page-header";
import { AdminRestaurantsView } from "@/components/admin/AdminRestaurantsView";

export default function AdminRestaurantsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Maqaayadaha (Restaurants Command Center)"
                description="Maamul maqaayadaha, dakhliga raashinka, menu-yada, iyo qiimo dhimista"
            />
            <AdminRestaurantsView />
        </div>
    );
}
