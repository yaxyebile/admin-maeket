import React, { useState } from "react";
import { useAuthStore } from "./useAuthStore";
import { useProducts } from "./useProducts";
import { supabase } from "./supabaseClient";
import {
    Package,
    CheckCircle,
    XCircle,
    Trash2,
    Edit2,
    Save,
    Search,
    Filter,
    AlertTriangle,
    Inbox
} from "lucide-react";

export default function ProductsPage() {
    const { user, storeId } = useAuthStore();
    const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending" | "rejected">("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Custom react-query hook
    const { data: products = [], isLoading, refetch } = useProducts({
        role: user?.role || "staff",
        storeId,
        statusFilter: filterStatus === "all" ? undefined : filterStatus
    });

    const [editingStockId, setEditingStockId] = useState<string | null>(null);
    const [editingStockValue, setEditingStockValue] = useState<number>(0);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Approve product
    const handleApprove = async (productId: string) => {
        setUpdatingId(productId);
        try {
            const { error } = await supabase
                .from("products")
                .update({ is_approved: true, status: "approved" })
                .eq("id", productId);

            if (error) throw error;
            refetch();
        } catch (err) {
            alert("Error approving product: " + (err as any).message);
        } finally {
            setUpdatingId(null);
        }
    };

    // Reject product
    const handleReject = async (productId: string) => {
        setUpdatingId(productId);
        try {
            const { error } = await supabase
                .from("products")
                .update({ is_approved: false, status: "rejected" })
                .eq("id", productId);

            if (error) throw error;
            refetch();
        } catch (err) {
            alert("Error rejecting product: " + (err as any).message);
        } finally {
            setUpdatingId(null);
        }
    };

    // Delete product
    const handleDelete = async (productId: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        setUpdatingId(productId);
        try {
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", productId);

            if (error) throw error;
            refetch();
        } catch (err) {
            alert("Error deleting product: " + (err as any).message);
        } finally {
            setUpdatingId(null);
        }
    };

    // Save editable stock
    const handleSaveStock = async (productId: string) => {
        setUpdatingId(productId);
        try {
            const { error } = await supabase
                .from("products")
                .update({ stock: editingStockValue })
                .eq("id", productId);

            if (error) throw error;
            setEditingStockId(null);
            refetch();
        } catch (err) {
            alert("Error updating stock: " + (err as any).message);
        } finally {
            setUpdatingId(null);
        }
    };

    const startEditingStock = (productId: string, currentStock: number) => {
        setEditingStockId(productId);
        setEditingStockValue(currentStock);
    };

    const filteredProducts = products.filter(
        (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.store_name && p.store_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">Products Catalog</h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                        {user?.role === "admin"
                            ? "Super Admin — manages and approves products from all stores"
                            : `Store Manager — manages products for current store`
                        }
                    </p>
                </div>
            </div>

            {/* Direct Quick Filters & Controls */}
            <div className="grid gap-4 md:grid-cols-3 bg-slate-900 border border-slate-80) p-4 rounded-2xl">
                <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by product name or store..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white"
                    />
                </div>

                {/* Dropdown status filter */}
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-405 shrink-0" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white outline-none"
                    >
                        <option value="all">All Approvals</option>
                        <option value="approved">Approved only</option>
                        <option value="pending">Pending only</option>
                        <option value="rejected">Rejected only</option>
                    </select>
                </div>

                {/* Counter Info */}
                <div className="flex items-center justify-end px-2 text-xs font-semibold text-slate-400">
                    Showing {filteredProducts.length} of {products.length} products
                </div>
            </div>

            {/* Main Table Screen */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {isLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-emerald-500" />
                        <span className="text-slate-400 text-sm font-medium">Fetching catalog entries...</span>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-16 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                            <Inbox className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-350">No Products Found</p>
                            <p className="text-slate-500 text-xs mt-1">Try resetting your search query or filters.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-850">
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider">Item Image</th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider">Product Name</th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider">Store Name</th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider text-right">Price</th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider text-center">Stock Level</th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider text-center">Status</th>
                                    <th className="py-4 px-6 text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                                {filteredProducts.map((p) => {
                                    const isApproved = p.is_approved || p.status === "approved";
                                    const isRejected = p.status === "rejected";
                                    const isPending = !isApproved && !isRejected;

                                    return (
                                        <tr
                                            key={p.id}
                                            className={`hover:bg-slate-850/40 transition duration-150 ${updatingId === p.id ? "opacity-50 pointer-events-none" : ""
                                                }`}
                                        >
                                            {/* Product image */}
                                            <td className="py-4 px-6">
                                                <div className="h-12 w-12 rounded-xl bg-slate-800 overflow-hidden border border-slate-705 flex items-center justify-center">
                                                    {p.image ? (
                                                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-6 w-6 text-slate-600" />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Product Name */}
                                            <td className="py-4 px-6">
                                                <span className="font-semibold text-white truncate max-w-xs block">{p.name}</span>
                                                <span className="text-[10px] text-slate-500 font-mono tracking-tight block">ID: {p.id}</span>
                                            </td>

                                            {/* Store Name */}
                                            <td className="py-4 px-6">
                                                <span className="text-slate-400 font-medium">{p.store_name || "Direct Merchant"}</span>
                                            </td>

                                            {/* Price */}
                                            <td className="py-4 px-6 text-right font-bold text-emerald-400">
                                                ${Number(p.price || 0).toFixed(2)}
                                            </td>

                                            {/* Stock inline edit */}
                                            <td className="py-4 px-6 text-center">
                                                {editingStockId === p.id ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <input
                                                            type="number"
                                                            value={editingStockValue}
                                                            onChange={(e) => setEditingStockValue(parseInt(e.target.value) || 0)}
                                                            className="w-16 text-center bg-slate-950 border border-slate-750 rounded py-1 px-1.5 focus:outline-none text-white focus:ring-1 focus:ring-emerald-500 font-bold"
                                                        />
                                                        <button
                                                            onClick={() => handleSaveStock(p.id)}
                                                            className="p-1 text-emerald-500 hover:bg-slate-800 rounded transition"
                                                        >
                                                            <Save className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center justify-center gap-2 group">
                                                        <span className={`font-mono text-sm ${p.stock <= 5 ? "text-amber-500 font-bold" : "text-white"}`}>
                                                            {p.stock} units
                                                        </span>
                                                        <button
                                                            onClick={() => startEditingStock(p.id, p.stock)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded transition"
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-6 text-center">
                                                {isApproved ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        Approved
                                                    </span>
                                                ) : isRejected ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                                        Rejected
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-6 text-right space-x-1.5">
                                                {user?.role === "admin" && isPending && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(p.id)}
                                                            className="inline-flex items-center justify-center p-2 rounded-xl text-emerald-400 bg-emerald-500/10 hover:bg-emerald-505/20 border border-emerald-500/10 transition cursor-pointer"
                                                            title="Approve Listing"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(p.id)}
                                                            className="inline-flex items-center justify-center p-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-505/20 border border-red-500/10 transition cursor-pointer"
                                                            title="Reject Listing"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition cursor-pointer"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
