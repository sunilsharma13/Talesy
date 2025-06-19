// src/components/SessionWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
// import AuthRedirect from "@/components/AuthRedirect"; // <-- Remove or comment this out

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login"; // This correctly checks the URL path

  return (
    <SessionProvider>
      {/* <AuthRedirect />  */} {/* Remove this if middleware handles redirects */}
      {!isLogin && <Navbar />}
      <main className={isLogin ? "" : "container mx-auto p-4"}>{children}</main>
      {!isLogin && <Footer />}
    </SessionProvider>
  );
}