import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { canAccessAdminPath, getDefaultDestination } from "@/lib/roles";
import { isRoutePermitted } from "@/lib/menu-catalogue";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string | undefined;
    const allowed = Array.isArray(token?.allowedRoutes) ? (token.allowedRoutes as string[]) : null;

    // Redirect logged-in users away from auth pages
    if (path === "/login" && token) {
      return NextResponse.redirect(new URL(getDefaultDestination(role), req.url));
    }

    // The five HR workspaces have database-backed membership checks in their
    // server layouts. Only the access-management area itself remains global.
    const hasBackofficeAccess =
      canAccessAdminPath(path, role) || (allowed ? isRoutePermitted(path, role, allowed) : false);
    if ((path.startsWith("/admin") || path.startsWith("/recruitment")) && !hasBackofficeAccess) {
      return NextResponse.redirect(new URL(getDefaultDestination(role), req.url));
    }

    if (
      path.startsWith("/organization-development/goal-setting") &&
      role !== "SUPER_ADMIN" &&
      !(allowed && isRoutePermitted("/organization-development/goal-setting", role, allowed))
    ) {
      return NextResponse.redirect(new URL("/organization-development", req.url));
    }

    if (
      path.startsWith("/talent/talent-monitoring") &&
      role !== "SUPER_ADMIN" &&
      !(allowed && isRoutePermitted("/talent/talent-monitoring", role, allowed))
    ) {
      return NextResponse.redirect(new URL("/talent", req.url));
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
