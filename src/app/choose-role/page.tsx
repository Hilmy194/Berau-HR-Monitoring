import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE } from "@/lib/roles";
import {
  listEmployeeMaster,
  resolveEmployeeForSession,
} from "@/lib/services/hr-modules.service";
import {
  Building2,
  UserCheck,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Users,
  LogOut,
  Lock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Pilih Peran Masuk (Role Gateway) - Harmoni Berau Coal",
};

export default async function ChooseRolePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const [allEmployeesMaster] = await Promise.all([listEmployeeMaster()]);

  const userNameLower = (session.user.name || "").toLowerCase().trim();

  // Cari apakah user terdaftar sebagai karyawan di Dakar (hindari salah cocok jika email dipakai bersama)
  const employeeInDakar = resolveEmployeeForSession(allEmployeesMaster, session.user, {
    allowFebriwiadiAlias: true,
  });

  // Ambil bawahan langsung di Struktur Organisasi (SO)
  const directSubordinates = allEmployeesMaster.filter((emp) => {
    const sup = (emp.supervisorName || "").toLowerCase().trim();
    if (!sup || sup === "-" || sup === "unknown") return false;

    // 1. Cocokkan dengan nama employeeInDakar bila ada
    if (employeeInDakar) {
      const empName = employeeInDakar.name.toLowerCase().trim();
      if (
        sup === empName ||
        sup.includes(empName) ||
        empName.includes(sup) ||
        empName.split(" ").some((p) => p.length >= 4 && sup.includes(p))
      ) {
        return true;
      }
    }

    // 2. Cocokkan dengan nama session.user.name
    if (userNameLower && userNameLower.length >= 4) {
      if (
        sup === userNameLower ||
        sup.includes(userNameLower) ||
        userNameLower.includes(sup) ||
        userNameLower.split(" ").some((p) => p.length >= 4 && sup.includes(p))
      ) {
        return true;
      }
    }

    return false;
  });

  const hasSubordinates = directSubordinates.length > 0;
  // Syarat mutlak Leader: Terdaftar di SO dan memiliki staf bawahan langsung
  const isActualLeader = hasSubordinates || (session.user.role === ROLE.MANAGER && Boolean(employeeInDakar));
  const isHrAdmin = session.user.role === ROLE.SUPER_ADMIN || session.user.role === ROLE.HR_ADMIN;

  // Khusus karyawan biasa (bukan HR Admin & tidak memiliki bawahan):
  // Langsung otomatis diarahkan ke POV portal karyawan tanpa perlu memilih
  if (!isHrAdmin && !isActualLeader) {
    redirect("/trainings");
  }

  const userName = session.user.name || "Pengguna";

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100/60 text-slate-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.08) 1px, transparent 0)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* Top Brand Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between pb-4 border-b border-emerald-900/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 overflow-hidden p-1">
            <Image
              src="/harmoni-logo.png"
              alt="Harmoni PT Berau Coal"
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="leading-tight">
            <span className="text-base font-extrabold tracking-tight text-slate-900">Harmoni</span>
            <span className="text-[11px] font-semibold text-emerald-700 block">
              PT Berau Coal &middot; HR Monitoring System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right leading-tight">
            <span className="text-xs font-bold text-slate-900">{userName}</span>
            <span className="text-[11px] text-slate-500">
              {session.user.email} &middot; {session.user.role}
            </span>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white/80 hover:bg-slate-100 text-xs font-semibold text-slate-700 gap-1.5"
          >
            <Link href="/api/auth/signout">
              <LogOut className="h-3.5 w-3.5 text-slate-500" />
              <span>Keluar</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto w-full my-auto py-8 space-y-8">
        {/* Title Header */}
        <div className="text-center space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            Multi-Role Gateway &middot; Pilih Perspektif Akses
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Pilih Tampilan Sisi Akses
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Selamat datang, <strong className="text-emerald-800 font-bold">{userName}</strong>! Silakan tentukan peran yang ingin Anda gunakan untuk sesi kerja ini:
          </p>
        </div>

        {/* 3 Role Options Grid - Harmoni Theme */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* ========================================================================= */}
          {/* CARD 1: HR ADMINISTRATOR                                                  */}
          {/* ========================================================================= */}
          <Card
            className={`bg-white border rounded-2xl flex flex-col justify-between group overflow-hidden transition-all duration-300 ${isHrAdmin
              ? "border-slate-200/90 shadow-sm hover:shadow-xl hover:border-slate-800"
              : "border-slate-200/60 bg-slate-50/60 opacity-60 shadow-none cursor-not-allowed"
              }`}
          >
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-xl border transition-all ${isHrAdmin
                    ? "bg-slate-100 text-slate-800 border-slate-200 group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-emerald-400 group-hover:border-slate-800"
                    : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}
                >
                  <Building2 className="h-6 w-6" />
                </div>
                <Badge
                  className={`text-[10px] font-bold ${isHrAdmin
                    ? "bg-slate-100 text-slate-800 border-slate-200"
                    : "bg-slate-200 text-slate-500 border-slate-300"
                    }`}
                >
                  {isHrAdmin ? "Akses Menyeluruh" : "Khusus HR Admin"}
                </Badge>
              </div>
              <CardTitle
                className={`text-xl font-bold transition-colors ${isHrAdmin ? "text-slate-900 group-hover:text-slate-950" : "text-slate-500"
                  }`}
              >
                HR Administrator
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs leading-relaxed">
                Akses penuh mengelola seluruh talenta, suksesi, struktur organisasi, dan hak akses pengguna se-perusahaan.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2.5 text-xs text-slate-600 pb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${isHrAdmin ? "text-emerald-700" : "text-slate-400"}`} />
                <span>Monitoring 48+ Karyawan Se-Perusahaan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${isHrAdmin ? "text-emerald-700" : "text-slate-400"}`} />
                <span>Kelola Suksesi &amp; Mutasi Lintas Fungsi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${isHrAdmin ? "text-emerald-700" : "text-slate-400"}`} />
                <span>User Management &amp; Hak Akses Menu</span>
              </div>
            </CardContent>

            <CardFooter className="pt-4 border-t border-slate-100 bg-slate-50/50">
              {isHrAdmin ? (
                <Button
                  asChild
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 shadow-sm transition-all"
                >
                  <Link href="/admin" className="flex items-center justify-center gap-2">
                    <span>Masuk sebagai HR Admin</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <Button disabled className="w-full bg-slate-200 text-slate-400 font-bold h-11 cursor-not-allowed">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>Khusus HR Administrator</span>
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* ========================================================================= */}
          {/* CARD 2: LEADER / ATASAN TIM                                               */}
          {/* ========================================================================= */}
          {isActualLeader ? (
            <Card className="bg-white border-2 border-emerald-500 rounded-2xl shadow-md hover:shadow-2xl hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ring-4 ring-emerald-500/15">


              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                    {directSubordinates.length} Anggota
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Leader / Atasan Tim
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs leading-relaxed">
                  Fokus meninjau keselarasan IDP staf bawahan langsung, penyesuaian kriteria AI, dan persetujuan pengajuan training.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2.5 text-xs text-slate-600 pb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 font-bold shrink-0" />
                  <span className="font-medium text-slate-800">
                    {directSubordinates.length} Staf Bawahan di Divisi Anda
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 font-bold shrink-0" />
                  <span>Approval Pengajuan Training (TNA Fiori)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 font-bold shrink-0" />
                  <span>Edit &amp; Sesuaikan IDP Rekomendasi AI</span>
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t border-emerald-100 bg-emerald-50/40">
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 shadow-md shadow-emerald-600/30 transition-all"
                >
                  <Link href="/learning/idp?role=leader" className="flex items-center justify-center gap-2">
                    <span>Masuk sebagai Leader</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="bg-slate-50/70 border border-slate-200/90 rounded-2xl flex flex-col justify-between overflow-hidden opacity-75 shadow-xs">
              <div className="bg-slate-200 text-slate-600 text-[11px] font-semibold text-center py-1.5 tracking-wider uppercase flex items-center justify-center gap-1.5">
                <Lock className="h-3 w-3 text-slate-500" />
                <span>Bukan Atasan di SO</span>
              </div>

              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-slate-200 text-slate-500 rounded-xl">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="border-slate-300 text-slate-500 text-[10px] font-semibold">
                    0 Bawahan di SO
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-slate-600">
                  Leader / Atasan Tim
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs leading-relaxed">
                  Menu ini khusus diperuntukkan bagi atasan tim yang memiliki staf bawahan langsung di Struktur Organisasi (SO).
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2.5 text-xs text-slate-500 pb-6">
                <div className="flex items-center gap-2 text-slate-500">
                  <XCircle className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Tidak tercatat sebagai atasan di data SO</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <XCircle className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Tidak memiliki staf bawahan langsung</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Akses otomatis terbuka bila nama terdaftar di SO</span>
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t border-slate-200 bg-slate-100/60">
                <Button
                  disabled
                  className="w-full bg-slate-200 text-slate-500 font-bold h-11 cursor-not-allowed shadow-none"
                >
                  <Lock className="h-4 w-4 mr-2 text-slate-400" />
                  <span>Bukan Atasan (Tidak Ada Bawahan)</span>
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* CARD 3: KARYAWAN                                                          */}
          {/* ========================================================================= */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-xl hover:border-teal-600 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-teal-50 text-teal-800 rounded-xl border border-teal-200 group-hover:scale-105 group-hover:bg-teal-700 group-hover:text-white transition-all">
                  <User className="h-6 w-6" />
                </div>
                <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-[10px] font-bold">
                  {employeeInDakar ? "Karyawan Terdaftar" : "Portal Mandiri"}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                Karyawan ({userName})
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs leading-relaxed">
                {employeeInDakar ? (
                  <span>
                    {employeeInDakar.currentPosition} &middot; {employeeInDakar.department}
                  </span>
                ) : (
                  <span>
                    Portal mandiri bagi {userName} untuk melihat katalog pelatihan, mengajukan usulan training baru, dan memantau status atasan.
                  </span>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2.5 text-xs text-slate-600 pb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
                <span>Katalog Training STEM &amp; Non-STEM</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
                <span>Form Usulan Pelatihan (100% Dropdown)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
                <span>Status Verifikasi &amp; Catatan Atasan</span>
              </div>
            </CardContent>

            <CardFooter className="pt-4 border-t border-slate-100 bg-slate-50/50">
              <Button
                asChild
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold h-11 shadow-sm transition-all"
              >
                <Link href="/trainings" className="flex items-center justify-center gap-2">
                  <span>Masuk sebagai Karyawan</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Footer Guidance Note */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-center text-xs text-emerald-950 flex items-center justify-center gap-2 shadow-2xs">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-700 shrink-0" />
          <span>
            <strong>Informasi Akses:</strong> Anda dapat berganti perspektif peran kapan saja selama sesi kerja aktif melalui menu akun profil di pojok kanan atas layar (&quot;Ganti Peran&quot;).
          </span>
        </div>
      </div>

      {/* Corporate Copyright Footer */}
      <div className="text-center text-[11px] text-slate-400 py-2 border-t border-slate-200/60">
        &copy; {new Date().getFullYear()} PT Berau Coal &middot; Harmoni Human Resources Monitoring System
      </div>
    </div>
  );
}
