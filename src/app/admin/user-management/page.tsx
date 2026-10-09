import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/session";
import { ROLE } from "@/lib/roles";
import { listUsers } from "@/lib/services/user-management.service";
import { UserManagementPanel } from "@/components/admin/user-management-panel";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "User Management - Harmoni HR Monitoring",
};

export default async function UserManagementPage() {
  const session = await getSession();
  if (!session?.user || session.user.role !== ROLE.SUPER_ADMIN) {
    redirect("/admin");
  }

  const rawUsers = await listUsers();

  const formattedUsers = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    allowedRoutes: u.allowedRoutes,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    profile: u.profile,
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-slate-600 hover:text-slate-900">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Menu Admin
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Mode Super Admin
          </div>
        </div>

        {/* Client Panel */}
        <UserManagementPanel initialUsers={formattedUsers} />
      </div>
    </div>
  );
}
