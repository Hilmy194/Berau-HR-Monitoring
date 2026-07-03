import Link from "next/link";
import { ArrowLeft, Database, Layers3, UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { listEmployeeDirectory } from "@/lib/services/employee-directory.service";
import { EmployeeDirectory } from "@/components/admin/employee-directory";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Talent Management - Berau Coal" };

export default async function EmployeeManagementPage() {
  await requireAdmin();
  const employees = await listEmployeeDirectory();

  return (
    <div className="min-h-screen bg-[hsl(222.2,47.4%,11.2%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="outline" className="gap-2 rounded-full border-white/15 bg-white/10 text-white shadow-sm hover:bg-white/15 hover:text-white">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Menu
            </Link>
          </Button>
          <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 shadow-sm backdrop-blur sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <UsersRound className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Talent Workspace</p>
              <p className="text-xs text-white/60">Area talent card & direktori karyawan</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/80 shadow-[0_18px_60px_rgba(2,6,23,0.45)] backdrop-blur">
          <div className="relative overflow-hidden px-6 py-6 sm:px-8">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-primary/15 to-transparent sm:block" />
            <div className="absolute left-0 top-0 h-20 w-20 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 right-24 h-16 w-16 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  <Layers3 className="h-3.5 w-3.5" /> Talent Management
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Talent Directory Workspace</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                  Telusuri daftar employee, gunakan filter bila perlu, lalu buka halaman talent card tiap karyawan dari satu baris daftar.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm backdrop-blur">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
                  <UsersRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none text-white">{employees.length}</p>
                  <p className="mt-1 text-xs text-white/55">Total karyawan</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 bg-white/5 px-6 py-3 text-xs text-white/60 sm:px-8">
            <Database className="h-3.5 w-3.5" />
            Klik salah satu karyawan untuk masuk ke halaman talent card dan isi profil pengembangan per employee.
          </div>
        </div>

        <EmployeeDirectory employees={employees} />
      </div>
    </div>
  );
}
