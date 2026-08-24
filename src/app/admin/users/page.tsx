"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Shield, Ban, Eye, UserX, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/loading-skeleton";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionsLoading, setActionsLoading] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name");

      if (error) throw error;
      setUsers((data as any[]) ?? []);
    } catch (err: any) {
      toast.error("Failed to load user list: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdateRole = async (userId: string, role: string) => {
    setActionsLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);

      if (error) throw error;
      toast.success("User role updated successfully");
      load();
    } catch (err: any) {
      toast.error("Failed to update role: " + err.message);
    } finally {
      setActionsLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    setActionsLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !currentBanStatus })
        .eq("id", userId);

      if (error) throw error;
      toast.success(currentBanStatus ? "User unbanned successfully" : "User banned successfully");
      load();
    } catch (err: any) {
      toast.error("Failed to alter ban status: " + err.message);
    } finally {
      setActionsLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members Directory"
        description="View and administer user roles, drivers, and platform logins"
        action={
          <Link href="/admin/users/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register Administrator
            </Button>
          </Link>
        }
      />

      {/* Modern filters bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone or email..."
          className="pl-9 h-11 border-slate-200"
        />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
          No users match your search parameters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u: any) => {
            const isBanned = u.is_banned || false;
            const isActionActive = actionsLoading[u.id] || false;

            return (
              <Card key={u.id} className={`border-slate-100 hover:border-slate-205 transition ${isBanned ? "bg-red-50/10 border-red-105" : ""
                }`}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm ${isBanned ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                      }`}>
                      {u.name?.substring(0, 2).toUpperCase() || "US"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{u.name}</p>
                        {isBanned && (
                          <Badge variant="destructive" className="text-[9px] uppercase font-bold py-0.5 px-1.5">
                            Banned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{u.email}</p>
                      {u.phone && <p className="text-[11px] text-slate-400 mt-0.5">Phone: {u.phone}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Role Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-semibold uppercase">Role:</span>
                      <select
                        disabled={isActionActive}
                        value={u.role || "user"}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg text-xs font-semibold py-1.5 px-2.5 outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="admin">Super Admin</option>
                        <option value="seller">Store Manager (Seller)</option>
                        <option value="delivery">Delivery staff</option>
                        <option value="user">User (Customer)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Ban / Unban Toggle */}
                      <Button
                        size="sm"
                        disabled={isActionActive}
                        variant={isBanned ? "outline" : "destructive"}
                        onClick={() => handleToggleBan(u.id, isBanned)}
                        className="gap-1.5 text-xs font-medium cursor-pointer"
                      >
                        {isActionActive ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isBanned ? (
                          <>
                            <Shield className="h-3.5 w-3.5" /> Unban Access
                          </>
                        ) : (
                          <>
                            <Ban className="h-3.5 w-3.5" /> Ban User
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
