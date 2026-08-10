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
  const employeeMaster = await listEmployeeMaster();
  const masterIds = employeeMaster.map((employee) => employee.profileId);
  const profiles = masterIds.length
    ? await prisma.profile.findMany({
        where: { id: { in: masterIds } },
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      })
    : [];

  return profiles.map((profile) => {
    const master = employeeMaster.find((employee) => employee.profileId === profile.id);
    return {
      ...(master ?? {}),
      id: profile.id,
      name: profile.user.name || "-",
      email: profile.user.email || "-",
      photoUrl: profile.photoUrl,
      nik: profile.nik || "-",
      directorate: master?.directorate ?? "-",
      division: master?.division ?? "-",
      department: profile.department || "-",
      position: profile.position || "-",
      phone: profile.phone || "-",
      joinDate: profile.joinDate?.toISOString() ?? null,
      supervisorName: profile.supervisorName || "-",
      lastPromotionDate: master?.lastPromotionDate ?? null,
      employmentStatus: "Permanent",
      workLocation: getTalentString(profile.talentData, "workLocation") ?? "-",
    };
  });
}

function getTalentString(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : null;
}

export type EmployeeDirectoryItem = Awaited<ReturnType<typeof listEmployeeDirectory>>[number];
