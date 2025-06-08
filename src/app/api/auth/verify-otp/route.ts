import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || token.length !== 4) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("talesy");

    // Find OTP record and check if not expired (e.g., 15 mins)
    const resetRecord = await db.collection("passwordResets").findOne({ token });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    const now = new Date();
    const createdAt = new Date(resetRecord.createdAt);
    const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

    if (diffMinutes > 15) {
      return NextResponse.json(
        { error: "OTP expired" },
        { status: 400 }
      );
    }

    // Return success with userId so frontend can save or query on next step
    return NextResponse.json({ userId: resetRecord.userId });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle other methods
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}