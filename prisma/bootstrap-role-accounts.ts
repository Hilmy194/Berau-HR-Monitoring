import "./load-env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const prisma = new PrismaClient(
  dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined
);

const accounts = [
  { name: "Aditya Perkasa", email: "aditya.perkasa@techconnect.co.id", role: "SUPER_ADMIN" },
  { name: "Super Admin Harmoni", email: "superadmin@harmoni.com", role: "SUPER_ADMIN" },
  { name: "Admin Harmoni", email: "admin@harmoni.com", role: "HR_ADMIN" },
  { name: "Supervisor Harmoni", email: "supervisor@harmoni.com", role: "MANAGER" },
  { name: "HR Onboarding Harmoni", email: "hr@harmoni.com", role: "HR_USER" },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("password", 10);

  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, password: passwordHash, role: account.role },
      create: { ...account, password: passwordHash },
    });
    console.log(`${user.role}: ${user.email}`);
  }

  const newHires = await prisma.user.updateMany({
    where: { role: "NEW_HIRE" },
    data: { password: passwordHash },
  });
  console.log(`NEW_HIRE: ${newHires.count} akun memakai password awal yang sama`);
}

main()
  .catch((error) => {
    console.error("Bootstrap akun role gagal:", error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
