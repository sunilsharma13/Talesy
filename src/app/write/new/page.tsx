"use client";

import dynamic from "next/dynamic";

// Dynamically import the client-only component
const WritePageClient = dynamic(() => import("@/components/WritePageClient"), {
  ssr: false,
});

export default function WriteNewPage() {
  return <WritePageClient />;
}
