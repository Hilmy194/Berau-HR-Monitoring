import { prisma } from "@/lib/prisma";

/**
 * Read model for Employee Management.
 *
 * Today, identity and employment basics come from the probation database.
 * Keeping the mapping here gives future HRIS, attendance, payroll, and talent
 * sources one integration boundary without coupling the UI to those systems.
 */
export async function listEmployeeDirectory() {
  const profiles = await prisma.profile.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.user.name,
    email: profile.user.email,
    photoUrl: profile.photoUrl,
    nik: profile.nik,
    department: profile.department,
    position: profile.position,
    phone: profile.phone,
    joinDate: profile.joinDate?.toISOString() ?? null,
    supervisorName: profile.supervisorName,
    // Reserved for future employee master-data sources.
    employmentStatus: null as string | null,
    workLocation: null as string | null,
  }));
}

export type EmployeeDirectoryItem = Awaited<ReturnType<typeof listEmployeeDirectory>>[number];
