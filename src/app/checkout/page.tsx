"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { OrderItem, PaymentMethod, FulfillmentType } from "@/lib/types";
import { generateId, formatCurrency } from "@/lib/utils";
import { processWaafiPayment } from "@/lib/waafi-pay";
import { EvcPinModal } from "@/components/evc-pin-modal";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    ShoppingBag,
    CreditCard,
    PhoneCall,
    MapPin,
    User,
    CheckCircle2,
    ArrowRight,
    ShieldCheck,
    Zap,
    Truck,
    Footprints,
    Clock,
} from "lucide-react";

const DEMO_CART: OrderItem[] = [
    {
        productId: "p1",
        productName: "iPhone 15 Pro Max (256GB)",
        price: 1199,
        quantity: 1,
        storeId: "s1",
        storeName: "Mogadishu Electronics",
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300",
    },
    {
        productId: "p2",
        productName: "Wireless Noise-Canceling Earbuds",
        price: 49,
        quantity: 1,
        storeId: "s1",
        storeName: "Mogadishu Electronics",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300",
    },
];

export default function CheckoutPage() {
    const router = useRouter();

    // Fulfillment & Customer Form State
    const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("delivery");
    const [customerName, setCustomerName] = useState("Axmed Cali");
    const [customerPhone, setCustomerPhone] = useState("615123456");
    const [customerAddress, setCustomerAddress] = useState("Bakaara Market, Hodan, Mogadishu");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("evcPlus");

    // Flow State
    const [submitting, setSubmitting] = useState(false);
    const [showEvcModal, setShowEvcModal] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [orderCompleted, setOrderCompleted] = useState<boolean>(false);

    // Calculate subtotal, delivery fee, and grand total
    const subtotal = DEMO_CART.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    const deliveryFee = fulfillmentType === "pickup" ? 0 : 1.30;
    const grandTotal = subtotal + deliveryFee;

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerPhone.trim() || !customerName.trim()) {
            toast.error("Fadlan buuxi magacaaga iyo nambarkaaga taleefanka");
            return;
        }

        if (paymentMethod === "evcPlus") {
            const newOrderId = generateId();
            setCurrentOrderId(newOrderId);
            setShowEvcModal(true);
        } else {
            await processDirectOrder("pending", false);
        }
    };

    const handleConfirmEvcPin = async (pin: string) => {
        setSubmitting(true);
        const orderId = currentOrderId || generateId();

        try {
            const waafiRes = await processWaafiPayment({
                phone: customerPhone,
                amount: grandTotal,
                orderId: orderId,
                description: `Order #${orderId.slice(0, 8)} (${fulfillmentType.toUpperCase()})`,
            });

            if (!waafiRes.success) {
                toast.error(`EVC Payment failed: ${waafiRes.message}`);
                setSubmitting(false);
                return;
            }

            const { error } = await supabase.from("orders").insert({
                id: orderId,
                user_id: "demo-user-id",
                items: DEMO_CART,
                total_amount: grandTotal,
                date: new Date().toISOString(),
                status: "approved",
                is_paid: true,
                payment_method: "evcPlus",
                store_id: DEMO_CART[0].storeId,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_address: customerAddress,
                delivery_person_id: null,
                fulfillment_type: fulfillmentType,
                delivery_fee: deliveryFee,
            });

            if (error) {
                console.error("Error creating order:", error);
                toast.error(`Database error: ${error.message}`);
                setSubmitting(false);
                return;
            }

            setShowEvcModal(false);
            setOrderCompleted(true);
            toast.success(
                `Lacagta EVC Plus waa la bixiyay! Dalabkaaga (${fulfillmentType === "pickup" ? "🚶‍♂️ Pickup" : "🚚 Delivery"}) waa la xaqiijiyay.`
            );
        } catch (err: any) {
            toast.error(err?.message || "Payment processing error");
        } finally {
            setSubmitting(false);
        }
    };

    const processDirectOrder = async (
        status: "pending" | "approved",
        isPaid: boolean
    ) => {
        setSubmitting(true);
        const orderId = generateId();

        try {
            const { error } = await supabase.from("orders").insert({
                id: orderId,
                user_id: "demo-user-id",
                items: DEMO_CART,
                total_amount: grandTotal,
                date: new Date().toISOString(),
                status: status,
                is_paid: isPaid,
                payment_method: paymentMethod,
                store_id: DEMO_CART[0].storeId,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_address: customerAddress,
                delivery_person_id: null,
                fulfillment_type: fulfillmentType,
                delivery_fee: deliveryFee,
            });

            if (error) {
                toast.error(error.message);
            } else {
                setOrderCompleted(true);
                toast.success("Dalabkaaga waa loo diray dukaanka!");
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-md px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/restaurants")}
                            className="text-xs font-semibold text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100"
                        >
                            🍔 Food Delivery & Maqaayadaha →
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/delivery")}
                            className="text-xs font-semibold"
                        >
                            Delivery Drivers Dashboard →
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 pt-8">
                {orderCompleted ? (
                    <Card className="mx-auto max-w-lg text-center p-8 border-emerald-200 bg-white shadow-xl rounded-3xl">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-2xl font-extrabold text-slate-900">
                            Dalabkaaga waa la xaqiijiyay! 🎉
                        </CardTitle>
                        <CardDescription className="mt-2 text-sm text-slate-600">
                            {fulfillmentType === "pickup" ? (
                                <span className="text-emerald-700 font-bold">
                                    🚶‍♂️ ISKA SOO DOONO (PICKUP): Waxaad alaabta toos uga soo doonan kartaa dukaanka/maqaayadda. Delivery Fee: $0.00.
                                </span>
                            ) : (
                                <span>
                                    🚚 GAARSIIN (DELIVERY): Lacagta waa la bixiyay. Dalabkaagu toos wuxuu u galay delivery driver open pool-ka.
                                </span>
                            )}
                        </CardDescription>

                        <div className="my-6 rounded-2xl bg-slate-50 p-4 text-left text-xs space-y-2 border">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Order ID:</span>
                                <span className="font-mono font-bold text-slate-700">
                                    #{currentOrderId?.slice(0, 10) || "ORD-SUCCESS"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Nooca Fulfillment-ka:</span>
                                <Badge className={fulfillmentType === "pickup" ? "bg-emerald-600 text-white font-extrabold" : "bg-blue-600 text-white font-extrabold"}>
                                    {fulfillmentType === "pickup" ? "🚶‍♂️ Pickup (Iska Soo Doono)" : "🚚 Delivery (Gaarsiin)"}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Paid:</span>
                                <span className="font-bold text-primary">{formatCurrency(grandTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Customer:</span>
                                <span className="font-medium text-slate-800">{customerName} ({customerPhone})</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setOrderCompleted(false);
                                    setCurrentOrderId(null);
                                }}
                            >
                                Dalab Kale Sameey
                            </Button>
                            <Button
                                onClick={() => router.push("/restaurant")}
                                className="bg-rose-600 text-white font-bold"
                            >
                                Eeg Dashboard-ka Maqaayada →
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-12">
                        {/* Left Column - Checkout Details */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* 1. Fulfillment Option Selector (Delivery vs Pickup) */}
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="border-b bg-slate-50/50 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Footprints className="h-5 w-5 text-rose-600" />
                                        Habka Qaadashada Alaabta (Fulfillment Mode)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Option A: Delivery */}
                                        <button
                                            type="button"
                                            onClick={() => setFulfillmentType("delivery")}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${fulfillmentType === "delivery"
                                                ? "border-primary bg-primary/5 shadow-md"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="p-2 rounded-xl bg-blue-100 text-blue-700 font-bold">
                                                    <Truck className="h-5 w-5" />
                                                </div>
                                                <Badge className="text-[10px] font-extrabold border border-blue-300 text-blue-700 bg-blue-50">
                                                    +$2.00 Fee
                                                </Badge>
                                            </div>
                                            <p className="font-extrabold text-sm text-slate-900">🚚 Gaarsiin (Delivery)</p>
                                            <p className="text-[11px] text-slate-500 mt-1">
                                                Darawal ayaa alaabta/cuntada toos kuugu soo gaarsiinaya gurigaaga.
                                            </p>
                                        </button>

                                        {/* Option B: Pickup */}
                                        <button
                                            type="button"
                                            onClick={() => setFulfillmentType("pickup")}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${fulfillmentType === "pickup"
                                                ? "border-emerald-600 bg-emerald-50 shadow-md"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                                                    <Footprints className="h-5 w-5" />
                                                </div>
                                                <Badge className="bg-emerald-600 text-white font-black text-[10px]">
                                                    $0.00 FREE
                                                </Badge>
                                            </div>
                                            <p className="font-extrabold text-sm text-slate-900">🚶‍♂️ Iska Soo Doono (Pickup)</p>
                                            <p className="text-[11px] text-slate-500 mt-1">
                                                Alaabta toos uga soo doono dukaanka/maqaayada. Bilaash No Delivery Fee!
                                            </p>
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 2. Customer Information */}
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="border-b bg-slate-50/50 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        Macluumaadka Macmiilka
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Magacaaga Dhammaystiran</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                className="pl-9"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="Cali Axmed"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Taleefanka EVC Plus (*712*...#)</Label>
                                        <div className="relative">
                                            <PhoneCall className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                className="pl-9 font-mono"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                placeholder="615XXXXXX"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">
                                            {fulfillmentType === "pickup"
                                                ? "🚶‍♂️ Xilliga aad soo dooneyso dukaanka / Qoraal gaar ah (Pickup Time & Note)"
                                                : "🚚 Cinwaanka Gaarsiinta (Delivery Address)"}
                                        </Label>
                                        <div className="relative">
                                            {fulfillmentType === "pickup" ? (
                                                <Clock className="absolute left-3 top-3 h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            )}
                                            <Input
                                                className="pl-9"
                                                value={customerAddress}
                                                onChange={(e) => setCustomerAddress(e.target.value)}
                                                placeholder={
                                                    fulfillmentType === "pickup"
                                                        ? "Tusaale: Waxaan soo doonayaa 2:30 PM (Mogadishu Store)"
                                                        : "Bakaara, Hodan, Mogadishu"
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 3. Payment Method Selection */}
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="border-b bg-slate-50/50 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                        Habka Lacag Bixinta (Payment Method)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <RadioGroup
                                        value={paymentMethod}
                                        onValueChange={(val: string) => setPaymentMethod(val as PaymentMethod)}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center justify-between rounded-2xl border-2 border-primary bg-primary/5 p-4 cursor-pointer">
                                            <div className="flex items-center space-x-3">
                                                <RadioGroupItem value="evcPlus" id="evc" />
                                                <Label htmlFor="evc" className="font-bold text-slate-900 cursor-pointer flex items-center gap-2">
                                                    <span>EVC Plus (WAAFI Pay Direct Prompt)</span>
                                                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 font-extrabold flex items-center gap-1">
                                                        <Zap className="h-3 w-3" /> Automatic
                                                    </span>
                                                </Label>
                                            </div>
                                            <span className="text-xs font-semibold text-primary">Toos / Automatic</span>
                                        </div>

                                        <div className="flex items-center justify-between rounded-2xl border p-4 cursor-pointer hover:bg-slate-50">
                                            <div className="flex items-center space-x-3">
                                                <RadioGroupItem value="edahab" id="edahab" />
                                                <Label htmlFor="edahab" className="font-medium text-slate-700 cursor-pointer">
                                                    eDahab Mobile Money
                                                </Label>
                                            </div>
                                            <span className="text-xs text-slate-400">Manual</span>
                                        </div>
                                    </RadioGroup>

                                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                                        <span>Marka aad doorato EVC Plus oo aad taabato <strong>Pay & Confirm Order</strong>, API Purchase prompt ayaa taleefankaaga ku soo baxaya.</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-5">
                            <Card className="sticky top-24 shadow-md border-slate-200">
                                <CardHeader className="border-b bg-slate-50/50 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ShoppingBag className="h-5 w-5 text-primary" />
                                        Dukaanka & Alaabta
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="divide-y divide-slate-100">
                                        {DEMO_CART.map((item) => (
                                            <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                                                <img
                                                    src={item.image}
                                                    alt={item.productName}
                                                    className="h-12 w-12 rounded-xl object-cover border"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {item.storeName} • Qty: {item.quantity}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4 space-y-2 text-sm">
                                        <div className="flex justify-between text-slate-500">
                                            <span>Subtotal:</span>
                                            <span>{formatCurrency(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Delivery Fee:</span>
                                            {fulfillmentType === "pickup" ? (
                                                <span className="text-emerald-600 font-extrabold">$0.00 (Bilaash - Pickup)</span>
                                            ) : (
                                                <span className="text-slate-800 font-bold">{formatCurrency(deliveryFee)}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between font-extrabold text-lg text-slate-900 pt-2 border-t">
                                            <span>Warta Guud:</span>
                                            <span className="text-primary">{formatCurrency(grandTotal)}</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCheckoutSubmit}
                                        disabled={submitting}
                                        size="lg"
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold h-12 text-base rounded-2xl shadow-lg shadow-primary/20"
                                    >
                                        Pay & Confirm Order
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </main>

            {/* EVC PIN Modal Dialog */}
            <EvcPinModal
                open={showEvcModal}
                onClose={() => setShowEvcModal(false)}
                phone={customerPhone}
                amount={grandTotal}
                onConfirmPin={handleConfirmEvcPin}
                isProcessing={submitting}
            />
        </div>
    );
}
