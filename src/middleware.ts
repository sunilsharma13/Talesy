// src/middleware.ts (MAKE SURE THE FILE IS HERE OR AT THE PROJECT ROOT!)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define ALL paths that *require* a logged-in user
// Add any other paths that should only be accessible when logged in
const protectedPaths = [
  "/homepage",
  "/feed",
  "/write", // /write/new, /write/edit, etc.
  "/profile",
  "/dashboard",
  "/settings",
  "/notifications",
];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  console.log("Middleware checking token for path:", req.nextUrl.pathname);
  console.log("Token present:", !!token); // This will tell you if NextAuth found a session

  const { pathname } = req.nextUrl;

  // --- 1. Allow internal Next.js paths, static files, and authentication pages to pass through immediately ---
  // If the path is for API routes, _next (internal), or contains a file extension (like .png, .css)
  // or is your login/signup page itself, let it pass without further checks.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") || // Catches static assets like .png, .css, .js
    pathname === "/login" || // The actual URL path of your login page
    pathname === "/signup"   // If you have a signup page
  ) {
    return NextResponse.next();
  }

  // --- 2. Determine if the current path is one that requires authentication ---
  // Using .some() with startsWith for flexibility (e.g., "/write" matches "/write/new")
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // --- 3. Handle redirection for unauthenticated users trying to access protected paths ---
  if (!token && isProtectedPath) {
    console.log(`Middleware: Redirecting unauthenticated user from ${pathname} to /login`);
    const loginUrl = new URL("/login", req.url);
    // Crucially, add callbackUrl so user is redirected back to the intended page after successful login
    loginUrl.searchParams.set("callbackUrl", encodeURI(req.nextUrl.pathname + req.nextUrl.search));
    return NextResponse.redirect(loginUrl);
  }

  // --- 4. Handle specific redirection for authenticated users ---
  // If logged in and trying to go to root '/', redirect them to /feed
  if (token && pathname === "/") {
    console.log(`Middleware: Redirecting authenticated user from / to /feed`);
    const feedUrl = new URL("/feed", req.url);
    return NextResponse.redirect(feedUrl);
  }

  // --- 5. For all other cases (authenticated on protected path, or public path), proceed ---
  // Public paths like /landing, /pricing, /about will fall through here and render normally.
  return NextResponse.next();
}

// Define the matcher: This tells Next.js which paths the middleware should apply to.
// This should cover all the paths you are interested in checking for authentication
// or specific redirects (like '/' to '/feed').
export const config = {
  matcher: [
    "/", // Root path
    "/homepage/:path*",
    "/feed/:path*",
    "/profile/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/write/:path*", // Matches /write, /write/new, /write/edit, etc.
    "/pricing", // Public path, but included if you want middleware to see it
    "/about",   // Public path, but included if you want middleware to see it
    "/landing", // Public path, but included if you want middleware to see it
    // IMPORTANT: Do NOT include "/login" or "/signup" in the matcher here,
    // as they are handled by the `if` condition at the top of the middleware.
  ],
};