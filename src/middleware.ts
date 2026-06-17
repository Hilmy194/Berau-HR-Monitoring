import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string | undefined;

    // Redirect logged-in users away from auth pages
    if ((path === "/login" || path === "/register") && token) {
      const dest = role === "HR_ADMIN" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // Protect admin routes
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
    "/profile/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
