"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      status === "authenticated" &&
      (pathname === "/" || pathname === "/login")
    ) {
      router.push("/dashboard");
    }
  }, [status, router, pathname]);

  return null;
}
