import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useAuthStore } from "./useAuthStore";
import { KeyRound, Mail, AlertTriangle, Activity } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const navigate = useNavigate();
    const setSession = useAuthStore((state) => state.setSession);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            // 1. Supabase Auth sign in
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (error) {
                throw error;
            }

            if (data?.user) {
                // 2. Fetch role & credentials from profiles table
                const { data: profile, error: dbError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", data.user.id)
                    .single();

                if (dbError || !profile) {
                    throw new Error("Failed to load user profile. Make sure profile exists.");
                }

                if (profile.is_banned) {
                    await supabase.auth.signOut();
                    throw new Error("Your account has been banned by administrators.");
                }

                // 3. Update Zustand Store Session
                setSession(profile, data.session?.access_token || "");

                // 4. Redirect based on role
                if (profile.role === "admin") {
                    navigate("/dashboard");
                } else if (profile.role === "staff") {
                    navigate("/store");
                } else {
                    await supabase.auth.signOut();
                    throw new Error("Access Denied: Only Administrator and Store Manager logins are allowed.");
                }
            }
        } catch (err: any) {
            setErrorMsg(err.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 mb-4 border border-emerald-500/20">
                    <Activity className="h-10 w-10 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    EMARA Admin
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    Mobile Marketplace Portal
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-900 py-8 px-4 border border-slate-800 shadow-xl rounded-2xl sm:px-10">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold uppercase text-slate-450 tracking-wider">
                                Email Address
                            </label>
                            <div className="mt-2 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                                    placeholder="admin@emara.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold uppercase text-slate-450 tracking-wider">
                                Password
                            </label>
                            <div className="mt-2 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyRound className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="rounded-xl bg-red-950/30 border border-red-500/20 p-4">
                                <div className="flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                                    <p className="text-xs font-medium text-red-300">{errorMsg}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-555 hover:to-teal-555 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all select-none hover:shadow-emerald-900/10 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? "Verifying parameters..." : "Sign In to EMARA Admin"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
                        Security policy: Authorized accounts only. IPs are logged.
                    </div>
                </div>
            </div>
        </div>
    );
}
