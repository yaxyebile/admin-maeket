import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    image: string;
    store_id: string;
    store_name: string | null;
    is_approved: boolean;
    status: "pending" | "approved" | "rejected";
}

interface UseProductsParams {
    role: "admin" | "staff" | "delivery" | "user";
    storeId?: string | null;
    statusFilter?: "approved" | "pending" | "rejected" | "all";
}

export function useProducts({ role, storeId, statusFilter }: UseProductsParams) {
    return useQuery<Product[]>({
        queryKey: ["products", role, storeId, statusFilter],
        queryFn: async () => {
            let query = supabase.from("products").select(`
        id,
        name,
        description,
        price,
        stock,
        image,
        store_id,
        is_approved,
        status
      `);

            // 1. Role-Based Access Control filtering
            if (role === "staff" || role === "delivery") {
                if (!storeId) {
                    console.warn("Store Manager has no assigned store_id. Returning empty catalog.");
                    return [];
                }
                query = query.eq("store_id", storeId);
            }

            // 2. Status check mapping
            if (statusFilter && statusFilter !== "all") {
                if (statusFilter === "approved") {
                    query = query.or("status.eq.approved,is_approved.eq.true");
                } else if (statusFilter === "pending") {
                    query = query.eq("status", "pending").eq("is_approved", false);
                } else if (statusFilter === "rejected") {
                    query = query.eq("status", "rejected");
                }
            }

            const { data, error } = await query.order("name", { ascending: true });

            if (error) {
                throw new Error(error.message);
            }

            // 3. Populate store names dynamically from stores table to display in table
            const productsData = (data as any[]) || [];
            if (productsData.length === 0) return [];

            const storeIds = Array.from(new Set(productsData.map((p) => p.store_id).filter(Boolean)));

            const { data: storesList } = await supabase
                .from("stores")
                .select("id, name")
                .in("id", storeIds);

            const storeMap: Record<string, string> = {};
            (storesList || []).forEach((s) => {
                storeMap[s.id] = s.name;
            });

            return productsData.map((p) => ({
                ...p,
                store_name: storeMap[p.store_id] || "Direct Merchant",
            })) as Product[];
        },
        // Keep data fresh during layout changes
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes cache maturity
    });
}
export default useProducts;
