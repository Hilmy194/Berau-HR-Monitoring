"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { loginSchema, type LoginInput } from "@/lib/validations";

const INVALID_CREDENTIALS = "Invalid email or password. Please try again.";

export function LoginForm() {
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
        callbackUrl: callbackUrl || "/dashboard",
      });
      if (res?.error) {
        toast.error(res.error === "CredentialsSignin" ? INVALID_CREDENTIALS : res.error);
        return;
      }
      toast.success("Welcome back!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Enter your corporate credentials to access the probation monitoring portal.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="********" autoComplete="current-password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register here
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
