// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = [
  "/homepage",
  "/feed",
  "/write",
  "/profile",
  "/dashboard",
  "/settings",
  "/notifications",
];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  console.log("Middleware checking token for path:", req.nextUrl.pathname);
  console.log("Token present:", !!token); 

  const { pathname } = req.nextUrl;

  // 1. Allow static assets, API routes, and authentication pages always
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") || // Catches static files like favicon.ico, images, etc.
    pathname === "/login" || 
    pathname === "/signup" ||
    pathname === "/error"    // Ensure /error page is also allowed
  ) {
    return NextResponse.next();
  }

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // 2. Redirect unauthenticated users from protected paths to /login
  if (!token && isProtectedPath) {
    console.log(`Middleware: Redirecting unauthenticated user from ${pathname} to /login`);
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", encodeURI(req.nextUrl.pathname + req.nextUrl.search));
    return NextResponse.redirect(loginUrl);
  }

  // 3. Handle authenticated users at the root ("/") or after logout:
  // After a logout, even if a token is briefly present in the request context,
  // the session in NextAuth will be marked as expired.
  // NextAuth will try to redirect to /login.
  // We should only redirect to /landing if the user is genuinely authenticated
  // AND NOT in the process of logging out (i.e., not heading to /login).

  // If the user *is* authenticated (token is true) AND they are on the root path "/",
  // AND they are NOT coming from a NextAuth logout redirect (which would typically lead to /login)
  if (token && pathname === "/") {
      console.log(`Middleware: Redirecting authenticated user from / to /landing`);
      const landingUrl = new URL("/landing", req.url);
      return NextResponse.redirect(landingUrl);
  }

  // If none of the above conditions are met, proceed with the request.
  // This means:
  // - Authenticated user on a protected path (homepage, feed, etc.)
  // - Authenticated user on an unprotected non-auth path (pricing, about, landing)
  // - Unauthenticated user on an unprotected non-auth path (pricing, about, landing) - which is allowed by default if not in protectedPaths.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/", // Catches the root path
    "/homepage/:path*",
    "/feed/:path*",
    "/profile/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/write/:path*", 
    "/pricing", 
    "/about",   
    "/landing", 
    // Exclude NextAuth API routes as getToken handles them, and other static assets are also handled.
  ],
};