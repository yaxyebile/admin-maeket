"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PhoneCall, ShieldCheck, Smartphone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface EvcPinModalProps {
    open: boolean;
    onClose: () => void;
    phone: string;
    amount: number;
    onConfirmPin: (pin: string) => Promise<void>;
    isProcessing: boolean;
}

export function EvcPinModal({
    open,
    onClose,
    phone,
    amount,
    onConfirmPin,
    isProcessing,
}: EvcPinModalProps) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin || pin.length < 4) {
            setError("Fadlan geli PIN-kaaga EVC Plus (ugu yaraan 4 lambar)");
            return;
        }
        setError("");
        await onConfirmPin(pin);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !isProcessing && !val && onClose()}>
            <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden shadow-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl">
                <div className="bg-primary/20 p-6 text-center border-b border-white/10 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 mb-3 animate-bounce">
                        <Smartphone className="h-7 w-7" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-white tracking-wide">
                        EVC Plus Purchase Prompt
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-300 mt-1">
                        *712*61XXXXXXX*{amount}# USSD Direct Prompt
                    </DialogDescription>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Taleefanka:</span>
                            <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                <PhoneCall className="h-3.5 w-3.5" />
                                {phone}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Lacagta:</span>
                            <span className="font-extrabold text-xl text-primary">
                                {formatCurrency(amount)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="evc-pin" className="text-xs font-semibold text-slate-200">
                            Geli EVC Plus PIN-kaaga
                        </Label>
                        <Input
                            id="evc-pin"
                            type="password"
                            maxLength={6}
                            placeholder="••••"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value);
                                if (error) setError("");
                            }}
                            disabled={isProcessing}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-center text-2xl tracking-[0.5em] font-mono h-12 focus:border-primary focus:ring-primary"
                            autoFocus
                        />
                        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/5 rounded-xl p-2.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Lacag bixintu waa toos (WAAFI Pay API Secured). Marka PIN-ka aad bixiso dalabkaaga waa la xaqiijinayaa.</span>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            Kansal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-primary/20"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Bixinaya...
                                </>
                            ) : (
                                "Bixi & Xaqiiji"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
