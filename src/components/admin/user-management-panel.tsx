"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Building,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Hourglass,
  KeyRound,
  Lock,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Square,
  Trash2,
  Unlock,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MENU_CATALOGUE,
  type SubMenuItem,
  type WorkspaceMenuItem,
} from "@/lib/menu-catalogue";
import { ROLE, ROLE_LABELS, type RoleType } from "@/lib/roles";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  allowedRoutes: string[] | null;
  createdAt: string;
  updatedAt: string;
  profile?: {
    department: string | null;
    position: string | null;
    nik: string | null;
  } | null;
}

const WORKSPACE_ICONS: Record<string, React.ElementType> = {
  BriefcaseBusiness,
  Network,
  UsersRound,
  GraduationCap,
  Hourglass,
  Building,
};

export function UserManagementPanel({ initialUsers }: { initialUsers: UserItem[] }) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: ROLE.HR_USER as string,
    allowedRoutes: [] as string[],
  });

  // Expanded Workspaces in Checkbox Tree
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<string, boolean>>({
    onboarding: true,
    od: true,
    talent: true,
    learning: true,
    retire: true,
  });

  // Delete & Reset Password Confirm Dialogs
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [userToReset, setUserToReset] = useState<UserItem | null>(null);

  // Fetch Users
  async function refreshUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        toast.error(data.error ?? "Gagal memuat daftar pengguna");
      }
    } catch {
      toast.error("Koneksi gagal saat memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }

  // Open Create Dialog
  function handleOpenCreate() {
    setIsEditing(false);
    setEditingUserId(null);
    setFormData({
      name: "",
      email: "",
      role: ROLE.HR_USER,
      allowedRoutes: [],
    });
    setIsFormOpen(true);
  }

  // Open Edit Dialog
  function handleOpenEdit(user: UserItem) {
    setIsEditing(true);
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      allowedRoutes: user.allowedRoutes ?? [],
    });
    setIsFormOpen(true);
  }

  // Toggle Single Submenu Permission
  function toggleSubmenuRoute(routeOrId: string) {
    setFormData((prev) => {
      const current = prev.allowedRoutes;
      const exists = current.includes(routeOrId);
      const next = exists
        ? current.filter((r) => r !== routeOrId)
        : [...current, routeOrId];
      return { ...prev, allowedRoutes: next };
    });
  }

  // Toggle All Submenus in a Workspace
  function toggleAllWorkspaceSubmenus(workspace: WorkspaceMenuItem) {
    setFormData((prev) => {
      const workspaceSubRoutes = workspace.submenus.map((s) => s.href);
      const allSelected = workspaceSubRoutes.every((r) => prev.allowedRoutes.includes(r));

      let next: string[];
      if (allSelected) {
        // Deselect all in this workspace
        next = prev.allowedRoutes.filter((r) => !workspaceSubRoutes.includes(r));
      } else {
        // Select all in this workspace
        const set = new Set([...prev.allowedRoutes, ...workspaceSubRoutes]);
        next = Array.from(set);
      }
      return { ...prev, allowedRoutes: next };
    });
  }

  // Quick helper: Select All Menus across entire catalogue
  function selectAllMenus() {
    const allRoutes = MENU_CATALOGUE.flatMap((w) => w.submenus.map((s) => s.href));
    setFormData((prev) => ({ ...prev, allowedRoutes: allRoutes }));
  }

  // Quick helper: Clear All Selected Menus
  function clearAllMenus() {
    setFormData((prev) => ({ ...prev, allowedRoutes: [] }));
  }

  // Toggle workspace accordion collapse
  function toggleWorkspaceExpand(workspaceId: string) {
    setExpandedWorkspaces((prev) => ({
      ...prev,
      [workspaceId]: !prev[workspaceId],
    }));
  }

  // Submit Create or Edit
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama lengkap harus diisi");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email harus diisi");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && editingUserId) {
        // PUT update
        const res = await fetch(`/api/admin/users/${editingUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            allowedRoutes: formData.allowedRoutes,
          }),
        });
        const result = await res.json();
        if (res.ok) {
          toast.success(result.message ?? "Pengguna berhasil diperbarui");
          setIsFormOpen(false);
          await refreshUsers();
        } else {
          toast.error(result.error ?? "Gagal memperbarui pengguna");
        }
      } else {
        // POST create
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (res.ok) {
          toast.success(result.message ?? "Pengguna berhasil didaftarkan");
          setIsFormOpen(false);
          await refreshUsers();
        } else {
          toast.error(result.error ?? "Gagal mendaftarkan pengguna");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  // Reset Password Action
  async function handleResetPassword() {
    if (!userToReset) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userToReset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Password untuk ${userToReset.name} berhasil di-reset ke "password"`);
        setUserToReset(null);
      } else {
        toast.error(result.error ?? "Gagal mereset password");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  // Delete User Action
  async function handleDeleteUser() {
    if (!userToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Akun ${userToDelete.name} berhasil dihapus`);
        setUserToDelete(null);
        await refreshUsers();
      } else {
        toast.error(result.error ?? "Gagal menghapus pengguna");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.profile?.department && u.profile.department.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    return {
      total: users.length,
      superAdmin: users.filter((u) => u.role === ROLE.SUPER_ADMIN).length,
      admin: users.filter((u) => u.role === ROLE.HR_ADMIN).length,
      manager: users.filter((u) => u.role === ROLE.MANAGER).length,
      hrUser: users.filter((u) => u.role === ROLE.HR_USER).length,
      newHire: users.filter((u) => u.role === ROLE.NEW_HIRE).length,
    };
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
            Manajemen Pengguna & Hak Akses Menu
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Daftarkan pengguna baru, kelola role, dan tentukan secara spesifik menu &amp; submenu yang dapat diakses pengguna.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshUsers}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Pengguna Baru
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Total Pengguna" value={stats.total} icon={Users} color="slate" />
        <MetricCard label="Super Admin" value={stats.superAdmin} icon={Shield} color="purple" />
        <MetricCard label="Admin HR" value={stats.admin} icon={Building} color="blue" />
        <MetricCard label="Supervisor" value={stats.manager} icon={UserCheck} color="amber" />
        <MetricCard label="HR Onboarding" value={stats.hrUser} icon={BriefcaseBusiness} color="emerald" />
        <MetricCard label="New Hire" value={stats.newHire} icon={GraduationCap} color="cyan" />
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">
                Daftar Pengguna Terdaftar ({filteredUsers.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pengguna dengan batasan menu akan otomatis melihat menu yang tidak dicentang dalam status terkunci.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 w-40 text-xs bg-white">
                  <SelectValue placeholder="Semua Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Role</SelectItem>
                  <SelectItem value={ROLE.SUPER_ADMIN}>Super Admin</SelectItem>
                  <SelectItem value={ROLE.HR_ADMIN}>Admin HR</SelectItem>
                  <SelectItem value={ROLE.MANAGER}>Supervisor</SelectItem>
                  <SelectItem value={ROLE.HR_USER}>HR Onboarding</SelectItem>
                  <SelectItem value={ROLE.NEW_HIRE}>New Hire</SelectItem>
                </SelectContent>
              </Select>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, email, departemen..."
                  className="h-9 pl-8 text-xs bg-white"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Nama &amp; Email</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Departemen</th>
                  <th className="px-4 py-3.5">Akses Menu &amp; Submenu</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isSuper = user.role === ROLE.SUPER_ADMIN;
                    const hasCustom = Boolean(user.allowedRoutes && user.allowedRoutes.length > 0);
                    const allowedCount = user.allowedRoutes?.length ?? 0;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-900 text-sm">{user.name}</div>
                          <div className="text-slate-500 text-[11px]">{user.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {user.profile?.department ?? "-"}
                        </td>
                        <td className="px-4 py-3.5">
                          {isSuper ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] gap-1">
                              <Unlock className="h-3 w-3" /> Akses Penuh (Super Admin)
                            </Badge>
                          ) : !hasCustom ? (
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[11px] gap-1">
                              <Unlock className="h-3 w-3" /> Akses Default Role
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1 items-center">
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] gap-1 hover:bg-emerald-100">
                                <Lock className="h-3 w-3 text-emerald-700" />
                                {allowedCount} Submenu Diberikan
                              </Badge>
                              {/* Preview Workspace Tags */}
                              {MENU_CATALOGUE.map((ws) => {
                                const matchedCount = ws.submenus.filter((s) =>
                                  user.allowedRoutes?.includes(s.href)
                                ).length;
                                if (matchedCount === 0) return null;
                                return (
                                  <span
                                    key={ws.id}
                                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200"
                                  >
                                    {ws.label.split(" ")[0]} ({matchedCount}/{ws.submenus.length})
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(user)}
                              className="h-8 px-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Edit Hak Akses Menu & Role"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUserToReset(user)}
                              className="h-8 px-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                              title="Reset Password ke default 'password'"
                            >
                              <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset Pwd
                            </Button>
                            {user.role !== ROLE.SUPER_ADMIN && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUserToDelete(user)}
                                className="h-8 px-2 text-slate-400 hover:text-red-700 hover:bg-red-50"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                      Tidak ada pengguna yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT USER & GRANULAR MENU ACCESS */}
      {/* ========================================================================= */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              {isEditing ? <Pencil className="h-5 w-5 text-emerald-600" /> : <UserPlus className="h-5 w-5 text-emerald-600" />}
              {isEditing ? "Edit Pengguna & Hak Akses Menu" : "Daftarkan Pengguna Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tentukan identitas pengguna, role, dan pilih secara spesifik menu serta submenu yang boleh dibuka.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-5 py-2">
            {/* User Basic Info Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Email Login <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="budi.santoso@beraucoal.co.id"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Role Pengguna <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROLE.SUPER_ADMIN}>
                      👑 Super Admin (Akses Penuh Seluruh Sistem)
                    </SelectItem>
                    <SelectItem value={ROLE.HR_ADMIN}>
                      🏢 Admin HR (Pengembangan Organisasi, Talent, Learning, Retire)
                    </SelectItem>
                    <SelectItem value={ROLE.MANAGER}>
                      👨‍💼 Supervisor (Evaluasi &amp; Review Tim)
                    </SelectItem>
                    <SelectItem value={ROLE.HR_USER}>
                      📋 HR Onboarding (Staff Rekrutmen &amp; Probation)
                    </SelectItem>
                    <SelectItem value={ROLE.NEW_HIRE}>
                      👤 New Hire (Karyawan Masa Probation)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Default Password Notice */}
            {!isEditing && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800 flex items-start gap-2.5">
                <KeyRound className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Password Default:</span> Password awal pengguna baru otomatis diset ke <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">password</code>. Pengguna dapat mengubah passwordnya setelah login di menu Account.
                </div>
              </div>
            )}

            {/* Granular Menu & Submenu Access Tree */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-2 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    Hak Akses Menu &amp; Submenu (5 Workspace Utama)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Centang menu/submenu yang diizinkan untuk dibuka oleh pengguna ini. Menu yang tidak dicentang akan otomatis terkunci.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllMenus}
                    className="h-7 text-[11px] px-2"
                  >
                    Pilih Semua
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAllMenus}
                    className="h-7 text-[11px] px-2 text-slate-600"
                  >
                    Hapus Pilihan
                  </Button>
                </div>
              </div>

              {formData.role === ROLE.SUPER_ADMIN ? (
                <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-4 text-xs text-purple-900">
                  <div className="flex items-center gap-2 font-bold text-purple-800">
                    <ShieldCheck className="h-4 w-4" /> Role Super Admin Memiliki Akses Penuh
                  </div>
                  <p className="mt-1 text-[11px] text-purple-700">
                    Role Super Admin secara otomatis dapat membuka semua 5 workspace dan seluruh submenu tanpa pembatasan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {MENU_CATALOGUE.map((workspace) => {
                    const Icon = WORKSPACE_ICONS[workspace.icon] ?? BriefcaseBusiness;
                    const workspaceSubRoutes = workspace.submenus.map((s) => s.href);
                    const selectedCount = workspaceSubRoutes.filter((r) =>
                      formData.allowedRoutes.includes(r)
                    ).length;
                    const isAllSelected = selectedCount === workspace.submenus.length;
                    const isPartialSelected = selectedCount > 0 && !isAllSelected;
                    const isExpanded = expandedWorkspaces[workspace.id] ?? true;

                    return (
                      <div
                        key={workspace.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden"
                      >
                        {/* Workspace Header Checkbox Bar */}
                        <div className="flex items-center justify-between p-3 bg-white border-b border-slate-200">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleAllWorkspaceSubmenus(workspace)}
                              className="flex items-center justify-center h-5 w-5 rounded border border-slate-300 hover:border-emerald-600 transition-colors"
                            >
                              {isAllSelected ? (
                                <div className="h-full w-full bg-emerald-600 rounded flex items-center justify-center text-white">
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                              ) : isPartialSelected ? (
                                <div className="h-2.5 w-2.5 bg-emerald-600 rounded-sm" />
                              ) : null}
                            </button>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-800">
                                  {workspace.label}
                                </span>
                                <span className="ml-2 text-[10px] font-medium text-slate-500">
                                  ({selectedCount} dari {workspace.submenus.length} submenu dipilih)
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleWorkspaceExpand(workspace.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {/* Submenus Grid */}
                        {isExpanded && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50/70">
                            {workspace.submenus.map((sub) => {
                              const isChecked = formData.allowedRoutes.includes(sub.href);
                              return (
                                <label
                                  key={sub.id}
                                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                    isChecked
                                      ? "border-emerald-300 bg-emerald-50/70 text-emerald-950 font-medium"
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleSubmenuRoute(sub.href)}
                                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0 leading-tight">
                                    <div>{sub.label}</div>
                                    <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                      {sub.href}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Daftarkan Pengguna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: RESET PASSWORD CONFIRMATION */}
      {/* ========================================================================= */}
      <Dialog open={!!userToReset} onOpenChange={(open) => !open && setUserToReset(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-amber-700">
              <KeyRound className="h-5 w-5 text-amber-600" />
              Reset Password Pengguna
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Apakah Anda yakin ingin me-reset password akun <strong>{userToReset?.name}</strong> ({userToReset?.email}) kembali ke default <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">password</code>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setUserToReset(null)} disabled={loading}>
              Batal
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? "Mereset..." : "Ya, Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: DELETE USER CONFIRMATION */}
      {/* ========================================================================= */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-700">
              <Trash2 className="h-5 w-5 text-red-600" />
              Hapus Akun Pengguna
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus akun <strong>{userToDelete?.name}</strong> ({userToDelete?.email})? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setUserToDelete(null)} disabled={loading}>
              Batal
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Menghapus..." : "Ya, Hapus Pengguna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: "slate" | "purple" | "blue" | "amber" | "emerald" | "cyan";
}) {
  const colorMap = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
  };

  return (
    <div className={`rounded-xl border p-3.5 transition-all ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium opacity-80 truncate">{label}</span>
        <Icon className="h-4 w-4 opacity-75 shrink-0" />
      </div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === ROLE.SUPER_ADMIN) {
    return (
      <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 text-[10px]">
        Super Admin
      </Badge>
    );
  }
  if (role === ROLE.HR_ADMIN) {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 text-[10px]">
        Admin HR
      </Badge>
    );
  }
  if (role === ROLE.MANAGER) {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 text-[10px]">
        Supervisor
      </Badge>
    );
  }
  if (role === ROLE.HR_USER) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 text-[10px]">
        HR Onboarding
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-slate-600 text-[10px]">
      New Hire
    </Badge>
  );
}
