import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "./supabaseClient";

export type UserRole = "admin" | "user" | "delivery" | "staff";

export interface Profile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    store_id: string | null;
    is_banned: boolean;
}

interface AuthState {
    user: Profile | null;
    sessionToken: string | null;
    role: UserRole | null;
    storeId: string | null;
    loading: boolean;
    error: string | null;
    setSession: (profile: Profile | null, token: string | null) => void;
    setError: (error: string | null) => void;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            sessionToken: null,
            role: null,
            storeId: null,
            loading: true,
            error: null,

            setSession: (profile, token) => {
                set({
                    user: profile,
                    sessionToken: token,
                    role: profile ? profile.role : null,
                    storeId: profile ? profile.store_id : null,
                    loading: false,
                    error: null,
                });
            },

            setError: (err) => {
                set({ error: err, loading: false });
            },

            logout: async () => {
                await supabase.auth.signOut();
                set({
                    user: null,
                    sessionToken: null,
                    role: null,
                    storeId: null,
                    loading: false,
                    error: null,
                });
            },

            checkSession: async () => {
                set({ loading: true });
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        const { data: profile, error } = await supabase
                            .from("profiles")
                            .select("*")
                            .eq("id", session.user.id)
                            .single();

                        if (error) {
                            set({ error: "Failed to fetch user profile", loading: false });
                            return;
                        }

                        if (profile.is_banned) {
                            await supabase.auth.signOut();
                            set({
                                user: null,
                                sessionToken: null,
                                role: null,
                                storeId: null,
                                error: "Your account has been banned.",
                                loading: false,
                            });
                            return;
                        }

                        set({
                            user: profile as Profile,
                            sessionToken: session.access_token,
                            role: profile.role as UserRole,
                            storeId: profile.store_id,
                            error: null,
                            loading: false,
                        });
                    } else {
                        set({
                            user: null,
                            sessionToken: null,
                            role: null,
                            storeId: null,
                            loading: false,
                        });
                    }
                } catch (err: any) {
                    set({
                        error: err.message || "An authentication error occurred",
                        loading: false,
                    });
                }
            },
        }),
        {
            name: "emara-auth-store",
            partialize: (state) => ({
                user: state.user,
                sessionToken: state.sessionToken,
                role: state.role,
                storeId: state.storeId,
            }),
        }
    )
);
