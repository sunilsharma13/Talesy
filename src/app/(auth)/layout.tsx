// src/app/(auth)/layout.tsx

import SessionProvider from "@/components/ClientProviders";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
