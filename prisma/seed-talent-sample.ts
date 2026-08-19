import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TALENT_EMPLOYEES } from "./talent-seed-data";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

function normalizeTalentData(employee: (typeof TALENT_EMPLOYEES)[number]) {
  return {
    ...employee,
    sourceFile: "sample_input_berau_5orang_terisi.xlsx",
    sourceSheet: employee.developmentPrograms.length ? "DP" : "Employee",
    strength: employee.strength.length ? employee.strength : employee.technical.slice(0, 3),
    weakness: employee.weakness.length ? employee.weakness : ["Data-driven decision making", "Stakeholder influence"],
  };
}

async function main() {
  const employeePassword = await bcrypt.hash("demo123", 10);

  for (const employee of TALENT_EMPLOYEES) {
    const user = await prisma.user.upsert({
      where: { email: employee.email },
      update: {
        name: employee.name,
        role: "NEW_HIRE",
      },
      create: {
        name: employee.name,
        email: employee.email,
        password: employeePassword,
        role: "NEW_HIRE",
      },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        nik: employee.nik,
        phone: employee.phone ?? null,
        birthDate: employee.birthDate ? new Date(employee.birthDate) : null,
        department: employee.department,
        position: employee.position,
        joinDate: new Date(employee.joinDate),
        supervisorName: employee.supervisorName,
        probationStatus: "PASSED",
        workforceStage: "EMPLOYEE",
        talentData: normalizeTalentData(employee),
      },
      create: {
        userId: user.id,
        nik: employee.nik,
        phone: employee.phone ?? null,
        birthDate: employee.birthDate ? new Date(employee.birthDate) : null,
        department: employee.department,
        position: employee.position,
        joinDate: new Date(employee.joinDate),
        supervisorName: employee.supervisorName,
        probationStatus: "PASSED",
        workforceStage: "EMPLOYEE",
        talentData: normalizeTalentData(employee),
      },
    });
  }

  console.log(`Talent sample seed completed: ${TALENT_EMPLOYEES.length} employee profiles processed.`);
}

main()
  .catch((error) => {
    console.error("Talent sample seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
