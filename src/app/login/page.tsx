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
import { Loader2 } from "lucide-react";

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
        toast.error("Invalid email/phone or password");
        setSubmitting(false);
        return;
      }
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === "admin") router.push("/admin");
      else if (user.role === "seller") router.push("/seller");
      else {
        toast.error("This portal is for admin and seller accounts only");
        setSubmitting(false);
      }
    } catch {
      toast.error("Login failed. Check your connection.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
        <Logo className="items-center" />
        <p className="mt-4 text-sm text-slate-500">Mogadishu Market Admin Portal</p>
      </div>
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your email or phone number and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Email or Phone</Label>
              <Input
                id="login"
                placeholder="admin@market.com"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-400">
            Demo admin: admin@market.com / admin123
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
