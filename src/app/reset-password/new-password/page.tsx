// app/reset-password/new-password/page.tsx

"use client"; // force full client-side rendering

import dynamic from "next/dynamic";

// Lazy-load client component with suspense
const NewPasswordClient = dynamic(() => import("./NewPasswordClient"), {
  ssr: false,
});

export default function NewPasswordPage() {
  return <NewPasswordClient />;
}
