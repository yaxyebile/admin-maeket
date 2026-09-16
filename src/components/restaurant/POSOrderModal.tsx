"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Product, PaymentMethod, OrderItem } from "@/lib/types";
import { generateId, formatCurrency } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
    Plus,
    Minus,
    ShoppingCart,
    Phone,
    User,
    MapPin,
    CreditCard,
    CheckCircle2,
    Utensils,
    Loader2,
} from "lucide-react";

interface POSOrderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: Product[];
    restaurantStoreId: string;
    restaurantStoreName: string;
    onOrderCreated?: () => void;
}

export function POSOrderModal({
    open,
    onOpenChange,
    products,
    restaurantStoreId,
    restaurantStoreName,
    onOrderCreated,
}: POSOrderModalProps) {
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("evcPlus");
    const [submitting, setSubmitting] = useState(false);

    const handleQuantityChange = (productId: string, delta: number) => {
        setQuantities((prev) => {
            const current = prev[productId] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [productId]: next };
        });
    };

    // Calculate total amount & items
    const selectedItems: OrderItem[] = products
        .filter((p) => (quantities[p.id] || 0) > 0)
        .map((p) => ({
            productId: p.id,
            productName: p.name,
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : null,
            quantity: quantities[p.id] || 0,
            storeId: restaurantStoreId,
            storeName: restaurantStoreName,
            image: p.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150",
        }));

    const totalAmount = selectedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const handleSubmitPOSOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            toast.error("Fadlan dooro ugu yaraan hal nooc oo cunto ah");
            return;
        }
        if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
            toast.error("Fadlan geli magaca, taleefanka, iyo cinwaanka macmiilka");
            return;
        }

        setSubmitting(true);
        const orderId = generateId();

        try {
            const { error } = await supabase.from("orders").insert({
                id: orderId,
                user_id: "pos_direct_customer",
                items: selectedItems,
                total_amount: totalAmount,
                date: new Date().toISOString(),
                status: "approved", // Immediately approved for delivery pool!
                store_id: restaurantStoreId,
                payment_method: paymentMethod,
                is_paid: true,
                customer_name: customerName.trim(),
                customer_phone: customerPhone.trim(),
                customer_address: customerAddress.trim(),
                is_pos_order: true,
            });

            if (error) {
                toast.error(`Error placing POS order: ${error.message}`);
            } else {
                toast.success("✅ Dalabka POS waa la abuuray oo waxaa loo diray Delivery Pool!");
                setQuantities({});
                setCustomerName("");
                setCustomerPhone("");
                setCustomerAddress("");
                onOpenChange(false);
                if (onOrderCreated) onOrderCreated();
            }
        } catch {
            toast.error("Cillad ayaa dhacday marka la abuurayay dalabka");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
                            <Utensils className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-extrabold text-slate-900">
                                🍔 Direct POS Order Creation
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                U samee dalab cusub oo toos ah macmiilka (Direct POS System)
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmitPOSOrder} className="space-y-6 pt-2">
                    {/* Step 1: Select Food Menu Items */}
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 mb-3 flex items-center gap-1.5">
                            <ShoppingCart className="h-4 w-4" />
                            1. Doorashada Cuntada (Food Selection)
                        </h3>

                        {products.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">
                                Menu-ga maqaayada wali cunto lagu ma darin.
                            </p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 max-h-[260px] overflow-y-auto pr-1">
                                {products.map((item) => {
                                    const qty = quantities[item.id] || 0;
                                    const isOutOfStock = item.stock <= 0;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${qty > 0
                                                    ? "border-rose-500 bg-rose-50/30 shadow-xs"
                                                    : "border-slate-200 bg-white"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={item.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150"}
                                                    alt={item.name}
                                                    className="h-12 w-12 rounded-xl object-cover border shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs font-extrabold text-rose-600 mt-0.5">
                                                        {formatCurrency(Number(item.price))}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Quantity Controller */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {isOutOfStock ? (
                                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-lg">
                                                        Out of Stock
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(item.id, -1)}
                                                            disabled={qty <= 0}
                                                            className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-all"
                                                        >
                                                            <Minus className="h-3.5 w-3.5" />
                                                        </button>
                                                        <span className="w-5 text-center font-black text-xs text-slate-900">
                                                            {qty}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(item.id, 1)}
                                                            className="h-7 w-7 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 flex items-center justify-center transition-all shadow-xs"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Step 2: Customer Information */}
                    <div className="space-y-3 border-t pt-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            2. Xogta Macmiilka (Customer Information)
                        </h3>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    Magaca Macmiilka
                                </Label>
                                <Input
                                    required
                                    placeholder="E.g. Ahmed Ali"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="rounded-xl text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                    Taleefanka EVC / Dahab
                                </Label>
                                <Input
                                    required
                                    placeholder="61XXXXXXX"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                Cinwaanka Delivery-ga (Address)
                            </Label>
                            <Input
                                required
                                placeholder="E.g. Hodan, Taleex, Villa Somalia side..."
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                className="rounded-xl text-xs"
                            />
                        </div>
                    </div>

                    {/* Step 3: Payment Method Selector */}
                    <div className="space-y-3 border-t pt-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4" />
                            3. Habka Lacag Bixinta (Payment Method)
                        </h3>

                        <RadioGroup
                            value={paymentMethod}
                            onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                            className="grid grid-cols-3 gap-3"
                        >
                            <div
                                onClick={() => setPaymentMethod("evcPlus")}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "evcPlus"
                                        ? "border-rose-600 bg-rose-50 text-rose-700 shadow-xs"
                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                    }`}
                            >
                                <span className="font-extrabold text-xs">EVC Plus</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">WAAFI Direct</span>
                            </div>

                            <div
                                onClick={() => setPaymentMethod("cash")}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "cash"
                                        ? "border-rose-600 bg-rose-50 text-rose-700 shadow-xs"
                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                    }`}
                            >
                                <span className="font-extrabold text-xs">Cash on Delivery</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">Hands-on</span>
                            </div>

                            <div
                                onClick={() => setPaymentMethod("edahab")}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "edahab"
                                        ? "border-rose-600 bg-rose-50 text-rose-700 shadow-xs"
                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                    }`}
                            >
                                <span className="font-extrabold text-xs">eDahab</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">Dahabshiil</span>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Bottom Total Summary & Submit */}
                    <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase">Wartida Total-ka</p>
                            <p className="text-2xl font-black text-rose-600">
                                {formatCurrency(totalAmount)}
                            </p>
                            <p className="text-[11px] text-slate-500">
                                {selectedItems.length} nooc oo cunto ah oo la dooraday
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting || selectedItems.length === 0}
                            className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-lg shadow-rose-600/30 text-sm"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Diyaarinaya Dalabka...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5" />
                                    Rasmeyso POS Order
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
