import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string | undefined;

    // Redirect logged-in users away from auth pages
    if ((path === "/login" || path === "/register") && token) {
      const dest = role === "HR_ADMIN" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // Protect admin routes
    const isHrAdminRoute = path.startsWith("/admin")
      || path.startsWith("/recruitment")
      || path.startsWith("/organization-development")
      || path.startsWith("/talent")
      || path.startsWith("/learning");

    if (isHrAdminRoute && role !== "HR_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Auth pages are always accessible (handled in middleware above for redirect)
        if (path === "/login" || path === "/register") return true;
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
    "/login",
    "/register",
  ],
};
