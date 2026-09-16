import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string | undefined;

    // Redirect logged-in users away from auth pages
    if (path === "/login" && token) {
      const dest = role === "HR_ADMIN" ? "/admin" : role === "NEW_HIRE" ? "/dashboard" : "/workspaces";
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // The five HR workspaces have database-backed membership checks in their
    // server layouts. Only the access-management area itself remains global.
    if (path.startsWith("/admin") && role !== "HR_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
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
    "/login",
  ],
};
