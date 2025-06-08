// pages/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Correct import path

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };