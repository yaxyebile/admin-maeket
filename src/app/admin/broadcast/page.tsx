"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { generateId } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send, Users, Layers, User, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function BroadcastPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [sendTarget, setSendTarget] = useState<"all" | "role" | "user">("all");
    const [targetRole, setTargetRole] = useState<string>("user");
    const [targetUserId, setTargetUserId] = useState<string>("");

    useEffect(() => {
        fetchUserData();
        fetchHistory();
    }, []);

    async function fetchUserData() {
        try {
            const { data } = await supabase
                .from("profiles")
                .select("id, name, email, role, phone")
                .order("name", { ascending: true });

            const usersList = data || [];
            setProfiles(usersList);

            // Set initial selected target user
            if (usersList.length > 0) {
                setTargetUserId(usersList[0].id);
            }
        } catch (err: any) {
            console.error("Failed to load user profiles", err);
        }
    }

    const fetchHistory = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("app_notifications")
                .select("id, title, body, type, user_id, is_read, created_at")
                .order("created_at", { ascending: false })
                .limit(400);

            if (!error && data) {
                // Group duplicates of bulk inserts (broadcast cards)
                const groups: Record<string, {
                    id: string;
                    title: string;
                    body: string;
                    type: string;
                    created_at: string;
                    recipientCount: number;
                    recipientsSample: string[];
                }> = {};

                data.forEach((item: any) => {
                    const date = new Date(item.created_at);
                    // Match records inserted within 10 seconds of each other
                    const roundedTime = Math.floor(date.getTime() / 10000) * 10000;
                    const key = `${item.title || ""}_${item.body || ""}_${item.type || ""}_${roundedTime}`;

                    if (!groups[key]) {
                        groups[key] = {
                            id: item.id,
                            title: item.title,
                            body: item.body,
                            type: item.type,
                            created_at: item.created_at,
                            recipientCount: 0,
                            recipientsSample: []
                        };
                    }
                    groups[key].recipientCount++;
                    if (groups[key].recipientsSample.length < 3) {
                        groups[key].recipientsSample.push(item.user_id);
                    }
                });

                const historyList = Object.values(groups).sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                setHistory(historyList);
            }
        } catch (err: any) {
            console.log("Failed to query app_notifications history", err);
        }
    }, []);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            toast.error("Please fill in notification title and body");
            return;
        }

        setLoading(true);
        try {
            const newRecords: any[] = [];

            if (sendTarget === "all") {
                // To broadcast, iterate and write records for each active customer user (role === 'user')
                const activeCustomers = profiles.filter((p) => p.role === "user");
                if (activeCustomers.length === 0) {
                    throw new Error("No active customer users ('user' role) found to broadcast to.");
                }

                activeCustomers.forEach((cust) => {
                    newRecords.push({
                        id: generateId(),
                        user_id: cust.id,
                        title: title.trim(),
                        body: body.trim(),
                        type: "broadcast",
                        is_read: false
                    });
                });
            } else if (sendTarget === "role") {
                // Target a specific role group
                const roleUsers = profiles.filter((p) => p.role === targetRole);
                if (roleUsers.length === 0) {
                    throw new Error(`No users found with role: ${targetRole}`);
                }

                roleUsers.forEach((u) => {
                    newRecords.push({
                        id: generateId(),
                        user_id: u.id,
                        title: title.trim(),
                        body: body.trim(),
                        type: "broadcast",
                        is_read: false
                    });
                });
            } else if (sendTarget === "user") {
                // Specific user
                if (!targetUserId) {
                    throw new Error("Please select a target user.");
                }

                newRecords.push({
                    id: generateId(),
                    user_id: targetUserId,
                    title: title.trim(),
                    body: body.trim(),
                    type: "general",
                    is_read: false
                });
            }

            // Insert matching notify record or records to app_notifications
            const { error } = await supabase.from("app_notifications").insert(newRecords);

            if (error) {
                throw error;
            }

            toast.success(`Sent notification to ${newRecords.length} user(s) successfully!`);
            setTitle("");
            setBody("");
            fetchHistory();
        } catch (err: any) {
            toast.error("Delivery failed: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteMessage(msg: any) {
        if (!confirm("Are you sure you want to delete this notification record?")) return;
        try {
            // Retrieve time range to capture the exact batch (within 10 sec window)
            const date = new Date(msg.created_at);
            const startTime = new Date(date.getTime() - 10000).toISOString();
            const endTime = new Date(date.getTime() + 10000).toISOString();

            const { error } = await supabase
                .from("app_notifications")
                .delete()
                .eq("title", msg.title)
                .eq("body", msg.body)
                .eq("type", msg.type)
                .gte("created_at", startTime)
                .lte("created_at", endTime);

            if (error) throw error;
            toast.success("Notification record removed");
            fetchHistory();
        } catch (err: any) {
            toast.error("Failed to delete record: " + err.message);
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Broadcast Messages"
                description="Send push announcements and platform notifications directly to app_notifications table"
            />

            <div className="grid gap-6 md:grid-cols-3">
                {/* Form panel */}
                <Card className="md:col-span-2 border-slate-200">
                    <CardContent className="p-6">
                        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-emerald-500" /> Create Broadcast Campaign
                        </h3>

                        <form onSubmit={handleSend} className="space-y-5">
                            <div className="space-y-1">
                                <Label>Notification Title</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Flash Sale Alert! ⚡"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>Announcement Message (Body)</Label>
                                <Textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Type the notification payload summary here..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <div className="grid grid-cols-3 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setSendTarget("all")}
                                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold border transition ${sendTarget === "all"
                                            ? "bg-slate-900 border-slate-900 text-white"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        <Users className="h-4 w-4" /> All Customers
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSendTarget("role")}
                                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold border transition ${sendTarget === "role"
                                            ? "bg-slate-900 border-slate-900 text-white"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        <Layers className="h-4 w-4" /> Specific Role
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSendTarget("user")}
                                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold border transition ${sendTarget === "user"
                                            ? "bg-slate-900 border-slate-900 text-white"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        <User className="h-4 w-4" /> Specific User
                                    </button>
                                </div>
                            </div>

                            {sendTarget === "role" && (
                                <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <Label>Target Role Group</Label>
                                    <select
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-white text-slate-800"
                                    >
                                        <option value="user">User (Customers)</option>
                                        <option value="seller">Seller (Shop Owners)</option>
                                        <option value="delivery">Delivery Drivers</option>
                                        <option value="admin">Administrators</option>
                                    </select>
                                </div>
                            )}

                            {sendTarget === "user" && (
                                <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <Label>Target User Profile</Label>
                                    <select
                                        value={targetUserId}
                                        onChange={(e) => setTargetUserId(e.target.value)}
                                        className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-white text-slate-800"
                                    >
                                        {profiles.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.role.toUpperCase()}) {p.email ? `- ${p.email}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="pt-2">
                                <Button type="submit" disabled={loading} className="w-full gap-2 py-3">
                                    <Send className="h-4 w-4" /> {loading ? "Delivering..." : "Send Notification"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* History panel */}
                <Card className="border-slate-200">
                    <CardContent className="p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Campaign Sent History</h3>
                        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                            {history.length === 0 ? (
                                <p className="text-xs text-slate-400 py-6 text-center">No active notifications tracked.</p>
                            ) : (
                                history.map((msg, idx) => (
                                    <div key={`${msg.id}-${idx}`} className="p-3 bg-slate-55 border border-slate-100 rounded-xl relative group hover:bg-slate-100/50 transition">
                                        <button
                                            onClick={() => handleDeleteMessage(msg)}
                                            className="absolute top-2 right-2 text-slate-450 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                        <h5 className="font-semibold text-slate-800 text-xs pr-4">{msg.title}</h5>
                                        <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{msg.body}</p>
                                        <div className="mt-2.5 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                                            <span className="capitalize bg-slate-100 border px-1.5 py-0.5 rounded text-slate-600">
                                                {msg.type} ({msg.recipientCount} {msg.recipientCount === 1 ? 'user' : 'users'})
                                            </span>
                                            <span>
                                                {new Date(msg.created_at).toLocaleDateString([], {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
