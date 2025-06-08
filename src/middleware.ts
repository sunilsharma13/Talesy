// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  console.log("Middleware checking token for path:", req.nextUrl.pathname);
  console.log("Token present:", !!token);

  const { pathname } = req.nextUrl;

  // Allow API routes to pass through - we'll add auth checking inside the API handlers
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ✅ If not logged in and trying to access protected pages, send to /login
  if (!token && (pathname.startsWith("/dashboard") || pathname === "/" || pathname.startsWith("/write"))) {
    console.log("Redirecting to login from:", pathname);
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ If logged in and trying to go to / (home), redirect to /feed
  if (token && pathname === "/") {
    const feedUrl = new URL("/feed", req.url);
    return NextResponse.redirect(feedUrl);
  }

  // ✅ Dashboard will not redirect to /feed now
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard", "/feed", "/profile", "/write/:path*"],
};