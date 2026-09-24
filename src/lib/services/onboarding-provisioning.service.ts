import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { PROBATION_STATUS } from "@/lib/constants";
import { listBigQueryEmployees } from "./bq-employee.service";
import { initializeProbationOnboarding, probationEndFromJoinDate } from "./onboarding-defaults.service";

/**
 * Materializes BigQuery employees whose current work contract is Probation into
 * the operational onboarding tables. Existing app edits are preserved; only
 * missing profiles, task templates, and presentation schedules are created.
 */
export async function ensureBigQueryProbationOnboarding() {
  const employees = (await listBigQueryEmployees()).filter(
    (employee) => employee.track.workContract?.trim().toLocaleLowerCase("id-ID") === "probation",
  );
  if (!employees.length) return { employees: 0, createdProfiles: 0 };

  const personnelNumbers = employees.map((employee) => (employee.nik ?? employee.id).trim()).filter(Boolean);
  const emails = employees.map((employee) => employee.email.trim().toLocaleLowerCase("id-ID")).filter(Boolean);
  const existingProfiles = await prisma.profile.findMany({
    where: {
      OR: [
        { nik: { in: personnelNumbers } },
        ...(emails.length ? [{ user: { email: { in: emails } } }] : []),
      ],
    },
    include: { user: true },
  });
  const byNik = new Map(existingProfiles.filter((profile) => profile.nik).map((profile) => [profile.nik!, profile]));
  const byEmail = new Map(existingProfiles.map((profile) => [profile.user.email.toLocaleLowerCase("id-ID"), profile]));
  let createdProfiles = 0;

  for (const employee of employees) {
    const personnelNumber = (employee.nik ?? employee.id).trim();
    const sourceEmail = employee.email.trim().toLocaleLowerCase("id-ID");
    const accountEmail = sourceEmail || `${personnelNumber.toLocaleLowerCase("id-ID")}@onboarding.internal`;
    const joinDate = new Date(employee.joinDate);
    if (!personnelNumber || !Number.isFinite(joinDate.getTime())) continue;

    let profile = byNik.get(personnelNumber) ?? byEmail.get(accountEmail);
    if (profile) {
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: {
          nik: personnelNumber,
          workforceStage: "PROBATION",
          department: employee.department ?? profile.department,
          position: employee.currentPosition ?? profile.position,
          supervisorName: employee.supervisorName ?? profile.supervisorName,
          joinDate,
          probationStartDate: profile.probationStartDate ?? joinDate,
          probationEndDate: profile.probationEndDate ?? probationEndFromJoinDate(joinDate),
        },
        include: { user: true },
      });
    } else {
      const existingUser = await prisma.user.findUnique({ where: { email: accountEmail }, include: { profile: true } });
      if (existingUser?.profile) {
        profile = await prisma.profile.update({
          where: { id: existingUser.profile.id },
          data: {
            nik: personnelNumber,
            workforceStage: "PROBATION",
            department: employee.department ?? existingUser.profile.department,
            position: employee.currentPosition ?? existingUser.profile.position,
            supervisorName: employee.supervisorName ?? existingUser.profile.supervisorName,
            joinDate,
            probationStartDate: existingUser.profile.probationStartDate ?? joinDate,
            probationEndDate: existingUser.profile.probationEndDate ?? probationEndFromJoinDate(joinDate),
          },
          include: { user: true },
        });
      } else if (existingUser) {
        profile = await prisma.profile.create({
          data: onboardingProfileData(existingUser.id, personnelNumber, employee, joinDate),
          include: { user: true },
        });
        createdProfiles += 1;
      } else {
        const password = await bcrypt.hash(crypto.randomUUID(), 10);
        const user = await prisma.user.create({
          data: {
            name: employee.name,
            email: accountEmail,
            password,
            role: "NEW_HIRE",
            profile: { create: onboardingProfileCreateData(personnelNumber, employee, joinDate) },
          },
          include: { profile: { include: { user: true } } },
        });
        profile = user.profile!;
        createdProfiles += 1;
      }
    }

    byNik.set(personnelNumber, profile);
    byEmail.set(accountEmail, profile);
    await initializeProbationOnboarding(profile.id, joinDate);
  }

  return { employees: employees.length, createdProfiles };
}

function onboardingProfileData(
  userId: string,
  personnelNumber: string,
  employee: Awaited<ReturnType<typeof listBigQueryEmployees>>[number],
  joinDate: Date,
) {
  return { userId, ...onboardingProfileCreateData(personnelNumber, employee, joinDate) };
}

function onboardingProfileCreateData(
  personnelNumber: string,
  employee: Awaited<ReturnType<typeof listBigQueryEmployees>>[number],
  joinDate: Date,
) {
  return {
    nik: personnelNumber,
    department: employee.department ?? null,
    position: employee.currentPosition ?? null,
    supervisorName: employee.supervisorName ?? null,
    joinDate,
    probationStartDate: joinDate,
    probationEndDate: probationEndFromJoinDate(joinDate),
    probationStatus: PROBATION_STATUS.ACTIVE,
    workforceStage: "PROBATION",
  };
}
