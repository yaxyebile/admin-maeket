"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

export function RealtimeNotifier() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) return;

        const playChime = () => {
            try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const playNote = (freq: number, start: number, duration: number) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, start);
                    gain.gain.setValueAtTime(0.12, start);
                    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(start);
                    osc.stop(start + duration);
                };
                // double quick chime (C5 -> E5)
                playNote(523.25, audioCtx.currentTime, 0.15);
                playNote(659.25, audioCtx.currentTime + 0.1, 0.22);
            } catch (e) {
                console.error("Audio failed to load/play due to context interaction restriction", e);
            }
        };

        const channel = supabase
            .channel("orders_realtime_alert")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "orders",
                },
                (payload) => {
                    const newOrder = payload.new;
                    const items = Array.isArray(newOrder.items) ? newOrder.items : [];

                    // If role is seller, check if this order contains items for their store
                    if (user.role === "seller") {
                        const hasStoreItem = items.some((item: any) => item.storeId === user.store_id);
                        if (!hasStoreItem) return; // Ignore order if not for their store
                    }

                    // Play Sound
                    playChime();

                    // Show Actionable Toast
                    const targetUrl = user.role === "admin" ? "/admin/orders" : "/seller/orders";
                    toast.info("Dalab Cusub! 🛒", {
                        description: `${newOrder.customer_name || "Macaamiil"} ayaa hadda dalbaday alaab qiimaheedu yahay $${newOrder.total_amount}.`,
                        duration: 12000,
                        action: {
                            label: "Kala soco Halkan",
                            onClick: () => {
                                router.push(targetUrl);
                            },
                        },
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, router]);

    return null;
}
