import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Import from lib/auth.ts

// ... (rest of the code is the same)

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("Test Auth API - Session:", session);
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        message: "Not authenticated" 
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      authenticated: true,
      user: session.user,
      message: "Authenticated" 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error in test-auth route:", error);
    return NextResponse.json({ 
      authenticated: false,
      error: error.message,
      message: "Error checking authentication" 
    }, { status: 500 });
  }
}