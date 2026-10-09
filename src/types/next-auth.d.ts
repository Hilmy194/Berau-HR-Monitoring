import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      allowedRoutes?: string[] | null;
    };
  }

  interface User {
    role?: string;
    allowedRoutes?: string[] | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    allowedRoutes?: string[] | null;
  }
}
