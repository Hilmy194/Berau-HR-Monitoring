import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export interface UserManagementRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  allowedRoutes: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  profile?: {
    department: string | null;
    position: string | null;
    nik: string | null;
  } | null;
}

export async function listUsers(): Promise<UserManagementRecord[]> {
  try {
    // Direct robust SQL query to avoid Prisma Client DLL lock issues on Windows dev server
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        allowedRoutes: any;
        createdAt: Date;
        updatedAt: Date;
        department: string | null;
        position: string | null;
        nik: string | null;
      }>
    >`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u."allowedRoutes",
        u."createdAt",
        u."updatedAt",
        p.department,
        p.position,
        p.nik
      FROM "User" u
      LEFT JOIN "Profile" p ON p."userId" = u.id
      ORDER BY u."createdAt" DESC
    `;

    return rows.map((r) => {
      let parsedAllowed: string[] | null = null;
      if (r.allowedRoutes) {
        parsedAllowed = Array.isArray(r.allowedRoutes)
          ? r.allowedRoutes
          : typeof r.allowedRoutes === "string"
          ? JSON.parse(r.allowedRoutes)
          : null;
      }

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        allowedRoutes: parsedAllowed,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        profile: {
          department: r.department,
          position: r.position,
          nik: r.nik,
        },
      };
    });
  } catch (error) {
    console.error("Error listing users:", error);
    // Fallback query if raw join fails
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            department: true,
            position: true,
            nik: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      allowedRoutes: null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      profile: u.profile,
    }));
  }
}

export async function createUserWithPermissions(params: {
  name: string;
  email: string;
  role: string;
  allowedRoutes: string[];
}) {
  const { name, email, role, allowedRoutes } = params;
  const normalizedEmail = email.toLowerCase().trim();
  const defaultPasswordHash = await bcrypt.hash("password", 10);
  const allowedJson = allowedRoutes.length > 0 ? JSON.stringify(allowedRoutes) : null;

  // Insert User using raw SQL to be fully resilient against DLL lock
  await prisma.$executeRaw`
    INSERT INTO "User" (id, name, email, password, role, "allowedRoutes", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid()::text,
      ${name.trim()},
      ${normalizedEmail},
      ${defaultPasswordHash},
      ${role},
      ${allowedJson}::jsonb,
      NOW(),
      NOW()
    )
  `;

  // Fetch created user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (user) {
    // Create matching profile
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        probationStatus: "ACTIVE",
      },
      update: {},
    });
  }

  return user;
}

export async function updateUserWithPermissions(
  id: string,
  params: {
    name?: string;
    email?: string;
    role?: string;
    allowedRoutes?: string[] | null;
    resetPassword?: boolean;
  }
) {
  const { name, email, role, allowedRoutes, resetPassword } = params;

  if (name) {
    await prisma.$executeRaw`UPDATE "User" SET name = ${name.trim()}, "updatedAt" = NOW() WHERE id = ${id}`;
  }
  if (email) {
    await prisma.$executeRaw`UPDATE "User" SET email = ${email.toLowerCase().trim()}, "updatedAt" = NOW() WHERE id = ${id}`;
  }
  if (role) {
    await prisma.$executeRaw`UPDATE "User" SET role = ${role}, "updatedAt" = NOW() WHERE id = ${id}`;
  }
  if (allowedRoutes !== undefined) {
    const allowedJson = allowedRoutes && allowedRoutes.length > 0 ? JSON.stringify(allowedRoutes) : null;
    await prisma.$executeRaw`UPDATE "User" SET "allowedRoutes" = ${allowedJson}::jsonb, "updatedAt" = NOW() WHERE id = ${id}`;
  }
  if (resetPassword) {
    const passwordHash = await bcrypt.hash("password", 10);
    await prisma.$executeRaw`UPDATE "User" SET password = ${passwordHash}, "updatedAt" = NOW() WHERE id = ${id}`;
  }

  return prisma.user.findUnique({ where: { id } });
}
