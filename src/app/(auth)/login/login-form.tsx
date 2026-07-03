"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock3, Loader2, UserRoundCheck } from "lucide-react";
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
  const [employeeType, setEmployeeType] = useState<"permanent" | "non-permanent">("permanent");

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
        toast.error(res.error === "CredentialsSignin" ? INVALID_CREDENTIALS : res.error);
        return;
      }
      toast.success("Welcome back!");
      const session = await getSession();
      const destination = callbackUrl || (session?.user.role === "HR_ADMIN" ? "/admin" : "/dashboard");
      router.replace(destination);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/60 shadow-lg shadow-slate-200/60">
      <CardHeader className="space-y-5 pb-5">
        <div className="space-y-1.5">
          <CardTitle className="text-2xl">Masuk ke HR Monitoring</CardTitle>
          <CardDescription>Pilih jenis karyawan untuk melanjutkan.</CardDescription>
        </div>

        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Jenis karyawan">
          <button
            type="button"
            onClick={() => setEmployeeType("permanent")}
            className={`flex min-h-24 flex-col items-start justify-between rounded-xl border-2 p-4 text-left transition-colors ${
              employeeType === "permanent"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            }`}
            aria-pressed={employeeType === "permanent"}
          >
            <UserRoundCheck className={`h-5 w-5 ${employeeType === "permanent" ? "text-primary" : ""}`} />
            <span className="font-semibold">Karyawan Permanen</span>
          </button>

          <button
            type="button"
            onClick={() => setEmployeeType("non-permanent")}
            className={`flex min-h-24 flex-col items-start justify-between rounded-xl border-2 p-4 text-left transition-colors ${
              employeeType === "non-permanent"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            }`}
            aria-pressed={employeeType === "non-permanent"}
          >
            <Clock3 className={`h-5 w-5 ${employeeType === "non-permanent" ? "text-primary" : ""}`} />
            <span className="font-semibold">Karyawan Non Permanen</span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="border-t bg-muted/20 pt-6">
        {employeeType === "permanent" ? (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="nama@perusahaan.com" autoComplete="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <Input id="password" type="password" placeholder="********" autoComplete="current-password" {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Sedang masuk..." : "Masuk"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Belum memiliki akun?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Daftar di sini
              </Link>
            </p>
          </>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock3 className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-semibold">Segera Hadir</p>
            <p className="mt-1 text-sm text-muted-foreground">Login karyawan non permanen belum tersedia.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
