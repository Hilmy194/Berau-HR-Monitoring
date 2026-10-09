import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // Safe query to avoid DLL lock issues on Windows
        const users = await prisma.$queryRaw<
          Array<{
            id: string;
            name: string;
            email: string;
            password: string;
            role: string;
            allowedRoutes: any;
          }>
        >`
          SELECT id, name, email, password, role, "allowedRoutes"
          FROM "User"
          WHERE LOWER(email) = ${normalizedEmail}
          LIMIT 1
        `;

        const user = users[0];

        if (!user) {
          throw new Error("No account found with that email");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        let parsedRoutes: string[] | null = null;
        if (user.allowedRoutes) {
          parsedRoutes = Array.isArray(user.allowedRoutes)
            ? user.allowedRoutes
            : typeof user.allowedRoutes === "string"
            ? JSON.parse(user.allowedRoutes)
            : null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          allowedRoutes: parsedRoutes,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.allowedRoutes = (user as { allowedRoutes?: string[] | null }).allowedRoutes ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.allowedRoutes = (token.allowedRoutes as string[]) ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
