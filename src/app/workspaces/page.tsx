import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { HR_WORKSPACES, hasWorkspaceAccess } from "@/lib/workspaces";
import { ROLE, isAdmin } from "@/lib/roles";

export default async function WorkspaceSelectionPage() {
  const session = await requireAuth();
  if (session.user.role === ROLE.NEW_HIRE) redirect("/dashboard");
  if (isAdmin(session.user.role)) redirect("/admin");

  const grants = await prisma.userWorkspaceAccess.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { workspace: true, accessLevel: true, isActive: true },
  });
  const available = HR_WORKSPACES.filter((workspace) => hasWorkspaceAccess(session.user.role, grants, workspace.key));

  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-slate-50 px-6 py-16">
      <p className="text-sm font-semibold text-primary">Harmoni HR Monitoring</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">Pilih workspace</h1>
      <p className="mt-3 text-slate-600">Workspace yang tampil sesuai akses akun Anda.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {available.map((workspace) => (
          <Link key={workspace.key} href={workspace.routes[0]} className="rounded-xl border bg-white p-6 shadow-sm transition hover:border-primary hover:shadow-md">
            <h2 className="font-semibold text-slate-950">{workspace.label}</h2>
            <p className="mt-2 text-sm text-slate-600">{workspace.description}</p>
          </Link>
        ))}
      </div>
      {!available.length && <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Belum ada workspace yang diberikan. Hubungi HR Administrator.</p>}
    </main>
  );
}
