"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { loginSchema, type LoginInput } from "@/lib/validations";

const INVALID_CREDENTIALS = "Invalid email or password. Please try again.";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (res?.error) {
        // NextAuth Credentials provider surfaces the opaque "CredentialsSignin"
        // string to the client regardless of the authorize() thrown message.
        // Map it to a friendly, secure message that does not leak which field
        // was wrong.
        toast.error(res.error === "CredentialsSignin" ? INVALID_CREDENTIALS : res.error);
        return;
      }
      toast.success("Welcome back!");
      router.push(callbackUrl || "/");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex lg:hidden items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(222.2,47.4%,11.2%)]">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold">HR Digital</p>
          <p className="text-xs text-muted-foreground">Probation Monitoring</p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="font-medium">HR Admin</p>
                <p className="text-muted-foreground">admin@hrdigital.com</p>
                <p className="text-muted-foreground">admin123</p>
              </div>
              <div>
                <p className="font-medium">New Hire</p>
                <p className="text-muted-foreground">employee@hrdigital.com</p>
                <p className="text-muted-foreground">employee123</p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
