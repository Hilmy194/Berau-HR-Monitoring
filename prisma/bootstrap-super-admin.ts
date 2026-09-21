import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL ?? "superadmin@harmoni.com").trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "password";
  const name = process.env.SUPER_ADMIN_NAME ?? "Super Admin Harmoni";

  if (process.env.NODE_ENV === "production" && !process.env.SUPER_ADMIN_PASSWORD) {
    throw new Error("SUPER_ADMIN_PASSWORD wajib diisi saat bootstrap production");
  }

  if (!email || password.length < 8) {
    throw new Error("Email Super Admin wajib valid dan password minimal 8 karakter");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: passwordHash, role: "SUPER_ADMIN" },
    create: { name, email, password: passwordHash, role: "SUPER_ADMIN" },
  });

  console.log(`Super Admin HR siap: ${user.email}`);
}

main()
  .catch((error) => {
    console.error("Bootstrap Super Admin gagal:", error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
