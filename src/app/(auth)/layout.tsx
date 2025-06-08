// src/app/(auth)/layout.tsx

import SessionProvider from "@/components/SessionProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
