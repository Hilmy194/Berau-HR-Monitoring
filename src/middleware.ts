import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { canAccessAdminPath, getDefaultDestination } from "@/lib/roles";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string | undefined;

    // Redirect logged-in users away from auth pages
    if (path === "/login" && token) {
      return NextResponse.redirect(new URL(getDefaultDestination(role), req.url));
    }

    // The five HR workspaces have database-backed membership checks in their
    // server layouts. Only the access-management area itself remains global.
    if ((path.startsWith("/admin") || path.startsWith("/recruitment")) && !canAccessAdminPath(path, role)) {
      return NextResponse.redirect(new URL(getDefaultDestination(role), req.url));
    }

    if (path.startsWith("/organization-development/goal-setting") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/organization-development", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Auth pages are always accessible (handled in middleware above for redirect)
        if (path === "/login") return true;
        // All other protected routes require a token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/presentation/:path*",
    "/coaching/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/recruitment/:path*",
    "/organization-development/:path*",
    "/talent/:path*",
    "/learning/:path*",
    "/retire/:path*",
    "/workspaces",
    "/account",
    "/login",
  ],
};
