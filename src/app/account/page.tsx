import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, UserCircle } from "lucide-react";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, getDefaultDestination } from "@/lib/roles";
import { requireAuth } from "@/lib/session";

export default async function AccountPage() {
  const session = await requireAuth();
  const roleLabel = ROLE_LABELS[session.user.role as keyof typeof ROLE_LABELS] ?? session.user.role;
  const backHref = getDefaultDestination(session.user.role);

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
          <Button asChild variant="ghost" size="sm">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Informasi akun dan keamanan login Anda.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi akun</CardTitle>
              <CardDescription>Email digunakan untuk masuk ke Harmoni.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-3">
                <UserCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Nama</p>
                  <p className="break-words text-sm font-medium">{session.user.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="break-all text-sm font-medium">{session.user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium">{roleLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reset password</CardTitle>
              <CardDescription>Masukkan password lama sebelum membuat password baru.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
