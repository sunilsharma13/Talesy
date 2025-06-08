"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthRedirect from "@/components/AuthRedirect";

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <SessionProvider>
      <AuthRedirect />
      {!isLogin && <Navbar />}
      <main className={isLogin ? "" : "container mx-auto p-4"}>{children}</main>
      {!isLogin && <Footer />}
    </SessionProvider>
  );
}
