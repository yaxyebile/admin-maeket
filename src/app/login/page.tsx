"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Utensils, Shield, Store } from "lucide-react";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login: doLogin } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await doLogin(login.trim(), password);
      if (!user) {
        toast.error("Email/Phone ama Password-ka waa heysan ama ma saxana");
        setSubmitting(false);
        return;
      }
      toast.success(`Kusoo dhawoow, ${user.name}!`);

      if (user.role === "admin") router.push("/admin");
      else if (user.role === "restaurant") router.push("/restaurant");
      else if (user.role === "seller") router.push("/seller");
      else if (user.role === "delivery") router.push("/delivery");
      else if (user.role === "real_estate") router.push("/real-estate");
      else if (user.role === "second_hand") router.push("/second-hand");
      else router.push("/checkout");
    } catch {
      toast.error("Login failed. Check your connection.");
      setSubmitting(false);
    }
  };

  const handleDemoFill = (email: string, pass: string) => {
    setLogin(email);
    setPassword(pass);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="mb-8 text-center">
        <Logo className="items-center" />
        <p className="mt-4 text-sm text-slate-400 font-semibold">Mogadishu Market & Restaurant Portal</p>
      </div>

      <Card className="w-full max-w-md shadow-2xl bg-slate-900 border-slate-800 text-slate-100 rounded-3xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-black text-white">Sign in to your account</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Geli Email/Phone iyo Password-kaaga si aad u gasho
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login" className="text-xs font-bold text-slate-300">
                Email or Phone Number
              </Label>
              <Input
                id="login"
                placeholder="manager@restaurant.com"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoComplete="username"
                className="bg-slate-950 border-slate-800 text-white rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-slate-950 border-slate-800 text-white rounded-xl text-xs"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 font-black text-xs py-6 rounded-2xl"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Galayaa (Signing in)...
                </>
              ) : (
                "Gal Akoonka (Sign In)"
              )}
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
              Tijaabi Akoonada Demo-ga ah (Quick Demo Login)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill("restaurant@market.com", "restaurant123")}
                className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs font-bold hover:bg-rose-900/40 flex items-center justify-center gap-1.5 transition-all"
              >
                <Utensils className="h-3.5 w-3.5" />
                Restaurant Demo
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill("admin@market.com", "admin123")}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                Admin Demo
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
