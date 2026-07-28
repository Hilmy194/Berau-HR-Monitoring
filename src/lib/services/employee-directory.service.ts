import { prisma } from "@/lib/prisma";
import { listEmployeeMaster } from "./hr-modules.service";

/**
 * Read model for Employee Management.
 *
 * Today, identity and employment basics come from the probation database.
 * Keeping the mapping here gives future HRIS, attendance, payroll, and talent
 * sources one integration boundary without coupling the UI to those systems.
 */
export async function listEmployeeDirectory() {
  const [profiles, employeeMaster] = await Promise.all([
    prisma.profile.findMany({
      where: { workforceStage: "EMPLOYEE" },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    listEmployeeMaster(),
  ]);

  return profiles.map((profile) => {
    const master = employeeMaster.find((employee) => employee.profileId === profile.id);
    return {
    ...(master ?? {}),
    id: profile.id,
    name: profile.user.name,
    email: profile.user.email,
    photoUrl: profile.photoUrl,
    nik: profile.nik,
    department: profile.department,
    directorate: employeeMaster.find((employee) => employee.profileId === profile.id)?.directorate ?? null,
    division: employeeMaster.find((employee) => employee.profileId === profile.id)?.division ?? null,
    position: profile.position,
    phone: profile.phone,
    joinDate: profile.joinDate?.toISOString() ?? null,
    lastPromotionDate: master?.lastPromotionDate ?? null,
    supervisorName: profile.supervisorName,
    employmentStatus: "Permanent",
    workLocation: getTalentString(profile.talentData, "workLocation"),
    };
  });
}

function getTalentString(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : null;
}

export type EmployeeDirectoryItem = Awaited<ReturnType<typeof listEmployeeDirectory>>[number];
